export const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatMoney(value?: number | null) {
  return moneyFormatter.format(value ?? 0);
}

export function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return dateFormatter.format(new Date(value));
}

export function formatShortDate(value?: string | null) {
  if (!value) return "Not set";
  return shortDateFormatter.format(new Date(value));
}
