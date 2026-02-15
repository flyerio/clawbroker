import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createPaymentLink(
  appUserId: string,
  email: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      { price: process.env.STRIPE_CREDIT_PRICE_ID!, quantity: 1 },
    ],
    mode: "payment",
    metadata: { app_user_id: appUserId },
    customer_email: email,
    success_url: "https://clawbroker.ai/dashboard?payment=success",
    cancel_url: "https://clawbroker.ai/dashboard?payment=cancelled",
  });
  return session.url!;
}
