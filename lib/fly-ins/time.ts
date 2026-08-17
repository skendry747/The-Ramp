const zonedPartsFormatter = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let value = zonedPartsFormatter.get(timeZone);
  if (!value) {
    value = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    zonedPartsFormatter.set(timeZone, value);
  }
  return value;
}

function partsAt(instant: Date, timeZone: string) {
  const entries = formatter(timeZone).formatToParts(instant)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, Number(part.value)]);
  return Object.fromEntries(entries) as Record<string, number>;
}

export function isValidTimeZone(timeZone: string) {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function localDateTimeToIso(date: string, time: string, timeZone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !isValidTimeZone(timeZone)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = desiredUtc;

  for (let index = 0; index < 3; index += 1) {
    const parts = partsAt(new Date(candidate), timeZone);
    const representedUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    candidate += desiredUtc - representedUtc;
  }

  const result = new Date(candidate);
  const finalParts = partsAt(result, timeZone);
  if (finalParts.year !== year || finalParts.month !== month || finalParts.day !== day || finalParts.hour !== hour || finalParts.minute !== minute) return null;
  return result.toISOString();
}

export function eventDateTime(startsAt: string, timeZone: string) {
  const date = new Date(startsAt);
  const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const timeParts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const values = Object.fromEntries([...dateParts, ...timeParts].filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` };
}
