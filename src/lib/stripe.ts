import Stripe from "stripe";

// Single Stripe client (supports multiple currencies)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

// Plan configurations
export const PLANS = {
  FREE: {
    name: "Free",
    maxContracts: 3,
    maxUsers: 1,
    price: {
      BRL: { monthly: 0, yearly: 0 },
      USD: { monthly: 0, yearly: 0 },
    },
    stripePriceId: {
      BRL: { monthly: null, yearly: null },
      USD: { monthly: null, yearly: null },
    },
  },
  STARTER: {
    name: "Starter",
    maxContracts: 25,
    maxUsers: 3,
    price: {
      BRL: { monthly: 49, yearly: 499 }, // 15% discount on yearly
      USD: { monthly: 9, yearly: 92 },
    },
    stripePriceId: {
      BRL: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_BRL_PRICE_ID,
        yearly: process.env.STRIPE_STARTER_YEARLY_BRL_PRICE_ID,
      },
      USD: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_USD_PRICE_ID,
        yearly: process.env.STRIPE_STARTER_YEARLY_USD_PRICE_ID,
      },
    },
  },
  GROWTH: {
    name: "Growth",
    maxContracts: 100,
    maxUsers: 10,
    price: {
      BRL: { monthly: 149, yearly: 1519 },
      USD: { monthly: 29, yearly: 296 },
    },
    stripePriceId: {
      BRL: {
        monthly: process.env.STRIPE_GROWTH_MONTHLY_BRL_PRICE_ID,
        yearly: process.env.STRIPE_GROWTH_YEARLY_BRL_PRICE_ID,
      },
      USD: {
        monthly: process.env.STRIPE_GROWTH_MONTHLY_USD_PRICE_ID,
        yearly: process.env.STRIPE_GROWTH_YEARLY_USD_PRICE_ID,
      },
    },
  },
  PRO: {
    name: "Pro",
    maxContracts: 300,
    maxUsers: 20,
    price: {
      BRL: { monthly: 349, yearly: 3559 },
      USD: { monthly: 69, yearly: 703 },
    },
    stripePriceId: {
      BRL: {
        monthly: process.env.STRIPE_PRO_MONTHLY_BRL_PRICE_ID,
        yearly: process.env.STRIPE_PRO_YEARLY_BRL_PRICE_ID,
      },
      USD: {
        monthly: process.env.STRIPE_PRO_MONTHLY_USD_PRICE_ID,
        yearly: process.env.STRIPE_PRO_YEARLY_USD_PRICE_ID,
      },
    },
  },
  STUDIO: {
    name: "Studio",
    maxContracts: 1000,
    maxUsers: 50,
    price: {
      BRL: { monthly: 799, yearly: 8143 },
      USD: { monthly: 149, yearly: 1519 },
    },
    stripePriceId: {
      BRL: {
        monthly: process.env.STRIPE_STUDIO_MONTHLY_BRL_PRICE_ID,
        yearly: process.env.STRIPE_STUDIO_YEARLY_BRL_PRICE_ID,
      },
      USD: {
        monthly: process.env.STRIPE_STUDIO_MONTHLY_USD_PRICE_ID,
        yearly: process.env.STRIPE_STUDIO_YEARLY_USD_PRICE_ID,
      },
    },
  },
} as const;

export type PlanName = keyof typeof PLANS;
export type Currency = "BRL" | "USD";
export type Interval = "monthly" | "yearly";
