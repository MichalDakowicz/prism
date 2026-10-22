export function localDateText(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function recordDate(text: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text))
    throw new Error("Use a valid date in YYYY-MM-DD format.");
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    throw new Error("This calendar date does not exist.");
  if (text > localDateText(now))
    throw new Error("A PR date cannot be in the future.");
  return date.toISOString();
}
