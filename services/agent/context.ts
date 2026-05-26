import { resolveTimezone } from "@/lib/timezone";
import type { RealtimeContext } from "@/types/agent";

export function buildRealtimeContext(timezone?: string): RealtimeContext {
  const tz = resolveTimezone(timezone);
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const date = `${get("month")} ${get("day")}, ${get("year")}`;
  const time = `${get("hour")}:${get("minute")}:${get("second")}`;

  let utcOffset = "UTC";
  try {
    const offsetFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const offsetPart = offsetFormatter
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName");
    if (offsetPart?.value) utcOffset = offsetPart.value;
  } catch {
    // keep UTC
  }

  const isoDateTime = new Date()
    .toLocaleString("sv-SE", { timeZone: tz, hour12: false })
    .replace(" ", "T");

  return {
    isoDateTime: `${isoDateTime} (${tz})`,
    date,
    time,
    timezone: tz,
    dayOfWeek: get("weekday"),
    utcOffset,
  };
}
