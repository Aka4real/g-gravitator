import type { Hackathon } from "@/lib/supabase/types";

function formatIcsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcsText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function generateHackathonIcs(hackathon: Hackathon): string {
  const deadlineMs = new Date(hackathon.deadline_at).getTime();
  // Create a 2-hour submission deadline block ending at deadline_at
  const startIso = new Date(deadlineMs - 2 * 3600 * 1000).toISOString();
  const endIso = new Date(deadlineMs).toISOString();
  const stamp = formatIcsDate(new Date().toISOString());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//G-Gravitator Labs//OXAKALABS Hackathon Radar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:hackathon-${hackathon.id}@ggravitator.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatIcsDate(startIso)}`,
    `DTEND:${formatIcsDate(endIso)}`,
    `SUMMARY:${escapeIcsText(`[DEADLINE] ${hackathon.title} (${hackathon.prize_display})`)}`,
    `DESCRIPTION:${escapeIcsText(
      `${hackathon.summary}\n\nOrganizer: ${hackathon.organizer}\nPrize Pool: ${hackathon.prize_display}\nFormat: ${hackathon.format}\nApply / Source: ${hackathon.primary_url}\nTracked via G-Gravitator // OXAKALABS Radar`
    )}`,
    `LOCATION:${escapeIcsText(hackathon.location)}`,
    `URL:${hackathon.primary_url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    "DESCRIPTION:24H Hackathon Submission Warning — G-Gravitator Radar",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}
