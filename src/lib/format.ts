import { siteConfig } from "@/lib/config/site";

const { locale, timeZone, currency } = siteConfig;

const numberFormatter = new Intl.NumberFormat(locale, {
  maximumFractionDigits: 2,
  useGrouping: "always",
});

/** 1800 → "Bs 1.800". `null` → "Consultar precio". */
export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "Consultar precio";
  return `${currency.symbol} ${numberFormatter.format(amount)}`;
}

/** 90 → "1 h 30 min", 45 → "45 min" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

type DateInput = Date | string | number;
const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d));

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, { timeZone, ...opts });

const longDate = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const mediumDate = fmt({ weekday: "short", day: "numeric", month: "short" });
const shortDate = fmt({ day: "2-digit", month: "2-digit", year: "numeric" });
const time = fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Lunes, 10 de noviembre de 2026" (en hora de Bolivia) */
export const formatDateLong = (d: DateInput) => capitalize(longDate.format(toDate(d)));
/** "lun, 10 nov" */
export const formatDateMedium = (d: DateInput) => mediumDate.format(toDate(d));
/** "10/11/2026" */
export const formatDateShort = (d: DateInput) => shortDate.format(toDate(d));
/** "15:30" */
export const formatTime = (d: DateInput) => time.format(toDate(d));
/** "Lunes, 10 de noviembre de 2026 · 15:30" */
export const formatDateTime = (d: DateInput) => `${formatDateLong(d)} · ${formatTime(d)}`;

/** "+591 65060795" → "+591 650 60795"; acepta números de 8 dígitos o con prefijo. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith(siteConfig.phoneCountryCode)
    ? digits.slice(siteConfig.phoneCountryCode.length)
    : digits;
  if (local.length === 8) {
    return `+${siteConfig.phoneCountryCode} ${local.slice(0, 3)} ${local.slice(3)}`;
  }
  return phone;
}
