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
  STARTER: {
    automaticAlerts: true,
    automaticRenewal: true,
    automaticAdjustments: false,
    fileUpload: true,
  },
  GROWTH: {
    automaticAlerts: true,
    automaticRenewal: true,
    automaticAdjustments: true,
    fileUpload: true,
  },
  PRO: {
    automaticAlerts: true,
    automaticRenewal: true,
    automaticAdjustments: true,
    fileUpload: true,
  },
  STUDIO: {
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
  STARTER: {
    name: "Starter",
    maxContracts: 25,
    maxUsers: 3,
    features: PLAN_FEATURES.STARTER,
    price: {
      BRL: { monthly: 4900, yearly: 49000 }, // R$ 49/mês ou R$ 490/ano (10 meses)
      USD: { monthly: 1200, yearly: 12000 }, // $12/mês ou $120/ano (10 meses)
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
    features: PLAN_FEATURES.GROWTH,
    price: {
      BRL: { monthly: 14900, yearly: 149000 }, // R$ 149/mês ou R$ 1.490/ano (10 meses)
      USD: { monthly: 3500, yearly: 35000 }, // $35/mês ou $350/ano (10 meses)
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
    features: PLAN_FEATURES.PRO,
    price: {
      BRL: { monthly: 34900, yearly: 349000 }, // R$ 349/mês ou R$ 3.490/ano (10 meses)
      USD: { monthly: 8500, yearly: 85000 }, // $85/mês ou $850/ano (10 meses)
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
    maxContracts: 999999, // Virtually unlimited
    maxUsers: 999999, // Virtually unlimited
    features: PLAN_FEATURES.STUDIO,
    price: {
      BRL: { monthly: 74900, yearly: 749000 }, // R$ 749/mês ou R$ 7.490/ano (10 meses)
      USD: { monthly: 18000, yearly: 180000 }, // $180/mês ou $1.800/ano (10 meses)
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
