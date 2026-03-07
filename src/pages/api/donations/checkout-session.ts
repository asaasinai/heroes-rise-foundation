import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { handleApiError, sendError } from "@/lib/api-utils";
import { donationCheckoutSchema } from "@/lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const parsed = donationCheckoutSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, "Invalid donation payload.");

      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) return sendError(res, 503, "Stripe is not configured.");

      const stripe = new Stripe(stripeSecret);
      const interval = parsed.data.interval ?? "one_time";
      const amount = parsed.data.amount ?? 5000;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: interval === "monthly" ? "subscription" : "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amount,
              recurring: interval === "monthly" ? { interval: "month" } : undefined,
              product_data: {
                name: "Heroes Rise Foundation Donation",
                description:
                  interval === "monthly"
                    ? "Monthly support for heroes and vulnerable animals."
                    : "One-time donation for urgent support services."
              }
            }
          }
        ],
        success_url: `${siteUrl}/?donation=success`,
        cancel_url: `${siteUrl}/?donation=cancelled`,
        billing_address_collection: "auto"
      });

      return res.status(200).json({ data: { checkoutUrl: checkoutSession.url } });
    } catch (error) {
      return handleApiError(res, error);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
