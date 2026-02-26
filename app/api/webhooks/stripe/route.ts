import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { startMachine } from "@/lib/fly";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const appUserId = session.metadata?.app_user_id;
    const amountTotal = session.amount_total; // in cents

    if (!appUserId || !amountTotal) {
      console.error("Missing metadata or amount in Stripe session");
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const amountDollars = amountTotal / 100;

    // Read credit rate from pricing_config (fallback to 0.005)
    const { data: pricingRow } = await supabase
      .from("pricing_config")
      .select("cost_per_unit")
      .eq("service_key", "app-features")
      .single();
    const costPerCredit = pricingRow ? Number(pricingRow.cost_per_unit) : 0.005;
    const creditsToAdd = Math.round(amountDollars / costPerCredit);

    // Top up USD balance (read-then-increment)
    const { data: currentBal } = await supabase
      .from("usd_balance")
      .select("total_budget_usd")
      .eq("user_id", appUserId)
      .single();

    if (currentBal) {
      await supabase
        .from("usd_balance")
        .update({
          total_budget_usd: Number(currentBal.total_budget_usd) + amountDollars,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", appUserId);
    }

    // Top up CoBroker credits
    const { data: credits } = await supabase
      .from("user_credits")
      .select("total_credits, available_credits")
      .eq("user_id", appUserId)
      .single();

    if (credits) {
      await supabase
        .from("user_credits")
        .update({
          total_credits: credits.total_credits + creditsToAdd,
          available_credits: credits.available_credits + creditsToAdd,
        })
        .eq("user_id", appUserId);
    }

    // Reactivate if suspended
    const { data: agent } = await supabase
      .from("openclaw_agents")
      .select("id, fly_app_name, fly_machine_id")
      .eq("user_id", appUserId)
      .eq("status", "suspended")
      .single();

    if (agent) {
      // Start Fly.io machine
      if (agent.fly_app_name && agent.fly_machine_id) {
        await startMachine(agent.fly_app_name, agent.fly_machine_id);
      }

      // Mark as active and reset low-balance warning
      await supabase
        .from("openclaw_agents")
        .update({
          status: "active",
          low_balance_warned_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agent.id);
    }
  }

  return NextResponse.json({ received: true });
}
