import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { authorized } = await verifyAdminAccess();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("bot_pool")
    .select("*, user_identity_map(email)")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { authorized } = await verifyAdminAccess();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { bot_username, bot_token, fly_app_name, fly_machine_id } = body;

  if (!bot_username || !bot_token || !fly_app_name) {
    return NextResponse.json(
      { error: "bot_username, bot_token, and fly_app_name are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("bot_pool")
    .insert({
      bot_username,
      bot_token,
      fly_app_name,
      fly_machine_id: fly_machine_id || null,
      status: "available",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
