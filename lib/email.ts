import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const EMAIL_FROM = () => process.env.EMAIL_FROM || "isaac@cobroker.ai";

export async function sendActivationEmail({
  to,
  firstName,
  botUsername,
}: {
  to: string;
  firstName: string;
  botUsername: string;
}): Promise<boolean> {
  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM(),
      to,
      subject: "Your CRE AI agent is ready!",
      text: `Hi ${firstName},

Your ClawBroker AI agent is set up and ready to go!

Open this link to start chatting with your agent on Telegram:
https://t.me/${botUsername}?start=welcome

Your agent can search for commercial real estate listings, analyze deals, and send you alerts — all through Telegram.

If you have questions, reply to this email or reach out at support@clawbroker.ai.

— The ClawBroker Team`,
    });
    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

export async function sendSuspensionEmail({
  to,
  firstName,
  botUsername,
  totalBudget,
  stripePaymentLink,
}: {
  to: string;
  firstName: string;
  botUsername: string;
  totalBudget: string;
  stripePaymentLink: string;
}): Promise<boolean> {
  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM(),
      to,
      subject: "Your ClawBroker agent has been paused",
      text: `Hi ${firstName},

Your ClawBroker AI agent (@${botUsername}) has been paused because your $${totalBudget} credit balance has been fully used.

To reactivate your agent, add more credits here:
${stripePaymentLink}

Once payment is received, your bot will be back online automatically — usually within a few minutes.

If you have questions, reply to this email or reach out at support@clawbroker.ai.

— The ClawBroker Team`,
    });
    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}
