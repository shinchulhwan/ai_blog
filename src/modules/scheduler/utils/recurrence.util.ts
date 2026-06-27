import type { ScheduleRecurrence } from "@/types/schedule";

export function calculateNextScheduledAt(
  schedule: {
    recurrence: ScheduleRecurrence;
    customIntervalMinutes: number | null;
  },
  from: Date = new Date(),
): Date | null {
  if (schedule.recurrence === "ONCE") {
    return null;
  }

  return advanceByRecurrence(from, schedule.recurrence, schedule.customIntervalMinutes);
}

function advanceByRecurrence(
  current: Date,
  recurrence: ScheduleRecurrence,
  customIntervalMinutes: number | null,
): Date {
  const next = new Date(current);

  switch (recurrence) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      return next;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      return next;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      return next;
    case "CUSTOM": {
      const minutes = customIntervalMinutes ?? 60;
      next.setMinutes(next.getMinutes() + minutes);
      return next;
    }
    default:
      return next;
  }
}
