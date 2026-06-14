import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Publishable key — safe to expose to the browser.
export const STRIPE_PUBLISHABLE_KEY =
  "pk_live_51Slk6rFJc34cZ2J2kFjnOhObgbr3TfTUTuXIXClyYGYS7fhPXK0nfw8SuNzcn44SgrqurpZLGBEsJdLZ0viVq8dP00vIXODq10";

let stripePromise: Promise<Stripe | null> | null = null;
export function getStripePromise() {
  if (!stripePromise) stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}
