const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });
const plain = new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 12500 -> "₦12,500.00" */
export function formatNaira(amount: number): string {
  return naira.format(amount);
}

/** 12500 -> "12,500.00" (for inputs and tables that already show the currency) */
export function formatAmount(amount: number): string {
  return plain.format(amount);
}

/** Round to the nearest kobo. */
export function roundKobo(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Overtime is paid at time and a half. */
export const OVERTIME_MULTIPLIER = 1.5;

/** Hours in a Monday to Sunday week before overtime starts. */
export const STANDARD_WEEK_HOURS = 40;
