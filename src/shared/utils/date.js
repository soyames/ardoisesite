/**
 * Formats a Date object to YYYY-MM-DD in the local timezone.
 * Avoids the timezone shift bugs caused by date.toISOString().slice(0, 10).
 * 
 * @param {Date} [d=new Date()] 
 * @returns {string} YYYY-MM-DD
 */
export function toLocalDateString(d = new Date()) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
