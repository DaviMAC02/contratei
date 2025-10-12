import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: "BRL" | "USD" = "USD",
  locale: string = "en-US"
) {
  // Converte de centavos para reais
  const amountInReais = amount / 100;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amountInReais);
}

export function formatDate(date: Date | string, locale: string = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// Convert status enum (SNAKE_CASE) to translation key (camelCase)
export function getStatusTranslationKey(status: string): string {
  // Convert DUE_SOON to dueSoon, IN_RENEWAL to inRenewal, etc.
  return status
    .toLowerCase()
    .split("_")
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
}
