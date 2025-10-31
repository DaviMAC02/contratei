import Stripe from "stripe";

// Single Stripe client (supports multiple currencies)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

// Plan features configuration
export const PLAN_FEATURES = {
  FREE: {
    automaticAlerts: false,
    automaticRenewal: false,
    automaticAdjustments: false,
    fileUpload: false,
  },
  PRO: {
    automaticAlerts: true,
    automaticRenewal: true,
    automaticAdjustments: true,
    fileUpload: true,
  },
  ENTERPRISE: {
    automaticAlerts: true,
    automaticRenewal: true,
    automaticAdjustments: true,
    fileUpload: true,
  },
} as const;

// Plan configurations
export const PLANS = {
  FREE: {
    name: "Free",
    maxContracts: 3,
    maxUsers: 1,
    features: PLAN_FEATURES.FREE,
    price: {
      BRL: { monthly: 0, yearly: 0 },
      USD: { monthly: 0, yearly: 0 },
    },
    stripePriceId: {
      BRL: { monthly: null, yearly: null },
      USD: { monthly: null, yearly: null },
    },
  },
  PRO: {
    name: "Pro",
    maxContracts: 100,
    maxUsers: 10,
    features: PLAN_FEATURES.PRO,
    price: {
      BRL: { monthly: 9900, yearly: 99000 }, // R$ 99/mês ou R$ 990/ano (10 meses)
      USD: { monthly: 2500, yearly: 25000 }, // $25/mês ou $250/ano (10 meses)
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
  ENTERPRISE: {
    name: "Enterprise",
    maxContracts: 999999, // Virtually unlimited
    maxUsers: 999999, // Virtually unlimited
    features: PLAN_FEATURES.ENTERPRISE,
    price: {
      BRL: { monthly: 49900, yearly: 499000 }, // R$ 499/mês ou R$ 4.990/ano (10 meses)
      USD: { monthly: 12000, yearly: 120000 }, // $120/mês ou $1.200/ano (10 meses)
    },
    stripePriceId: {
      BRL: {
        monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_BRL_PRICE_ID,
        yearly: process.env.STRIPE_ENTERPRISE_YEARLY_BRL_PRICE_ID,
      },
      USD: {
        monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_USD_PRICE_ID,
        yearly: process.env.STRIPE_ENTERPRISE_YEARLY_USD_PRICE_ID,
      },
    },
  },
} as const;

export type PlanName = keyof typeof PLANS;
export type Currency = "BRL" | "USD";
export type Interval = "monthly" | "yearly";
export type PlanFeature = keyof typeof PLAN_FEATURES.FREE;

// Helper to check if a plan has a specific feature
export function hasPlanFeature(plan: PlanName, feature: PlanFeature): boolean {
  return PLANS[plan].features[feature];
}

// Helper to check if plan has unlimited contracts
export function hasUnlimitedContracts(plan: PlanName): boolean {
  return PLANS[plan].maxContracts >= 999999;
}

// Helper to check if plan has unlimited users
export function hasUnlimitedUsers(plan: PlanName): boolean {
  return PLANS[plan].maxUsers >= 999999;
}
