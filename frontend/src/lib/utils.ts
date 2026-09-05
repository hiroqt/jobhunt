import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  SGD: "S$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "CA$",
  AUD: "AU$",
  MYR: "RM",
  IDR: "Rp",
};

export const CURRENCY_FLAGS: Record<string, string> = {
  PHP: "🇵🇭",
  USD: "🇺🇸",
  SGD: "🇸🇬",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  MYR: "🇲🇾",
  IDR: "🇮🇩",
};

export function getCurrencyFlag(currency?: string): string {
  if (!currency) return "🇵🇭";
  const code = currency.trim().toUpperCase();
  return CURRENCY_FLAGS[code] || "🌐";
}

export function getCurrencySymbol(currency?: string): string {
  if (!currency) return "₱";
  const code = currency.trim().toUpperCase();
  return CURRENCY_SYMBOLS[code] || (code === "PHP" ? "₱" : "$");
}

export function formatSalary(
  amount?: number | null,
  currency: string = "PHP",
  includeFlag: boolean = false
): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "";
  const symbol = getCurrencySymbol(currency);
  const flag = includeFlag ? `${getCurrencyFlag(currency)} ` : "";
  return `${flag}${symbol}${amount.toLocaleString()}`;
}

export function formatSalaryRange(
  min?: number | null,
  max?: number | null,
  currency: string = "PHP",
  includeFlag: boolean = false
): string {
  const symbol = getCurrencySymbol(currency);
  const flag = includeFlag ? `${getCurrencyFlag(currency)} ` : "";
  if (min && max && min !== max) {
    return `${flag}${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
  }
  if (min) {
    return `${flag}${symbol}${min.toLocaleString()}+`;
  }
  if (max) {
    return `${flag}Up to ${symbol}${max.toLocaleString()}`;
  }
  return "";
}

