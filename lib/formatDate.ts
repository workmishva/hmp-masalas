import { format } from 'date-fns'

/**
 * IST offset: +05:30 from UTC (330 minutes).
 *
 * The `date-fns` `format()` always uses the local timezone of the
 * runtime (UTC on most cloud hosts).  This helper shifts the Date
 * object by the IST offset so `format()` prints IST values, then
 * appends " IST" to make the timezone explicit.
 */
const IST_OFFSET_MS = 330 * 60 * 1000 // +05:30 in milliseconds

/**
 * Return a Date object whose UTC fields equal the IST wall-clock
 * values of `date`.  Use only with `format()` — never persist this.
 */
function toIST(date: Date): Date {
  return new Date(date.getTime() + IST_OFFSET_MS + date.getTimezoneOffset() * 60_000)
}

/**
 * Formats a date in IST using the given `date-fns` format string.
 * Appends " IST" automatically unless `omitLabel` is true.
 *
 * @example
 *   formatIST(new Date(), 'dd MMM yyyy HH:mm')
 *   // → "05 Jul 2026 15:30 IST"
 */
export function formatIST(
  date: Date | string | number,
  formatStr: string,
  omitLabel = false,
): string {
  const d = date instanceof Date ? date : new Date(date)
  const formatted = format(toIST(d), formatStr)
  return omitLabel ? formatted : `${formatted} IST`
}
