import { describe, expect, it } from "vitest";
import { reminderOffsetForToday } from "../../src/domain/reminders";

describe("reminderOffsetForToday", () => {
  const reminderDays = [3, 2, 1, 0];

  it("D-3, D-2, D-1, D-0 disparan su propio offset", () => {
    expect(reminderOffsetForToday(3, reminderDays)).toBe(3);
    expect(reminderOffsetForToday(2, reminderDays)).toBe(2);
    expect(reminderOffsetForToday(1, reminderDays)).toBe(1);
    expect(reminderOffsetForToday(0, reminderDays)).toBe(0);
  });

  it("D+1 no dispara ningun recordatorio", () => {
    expect(reminderOffsetForToday(-1, reminderDays)).toBeNull();
  });

  it("dias fuera de la configuracion no disparan nada", () => {
    expect(reminderOffsetForToday(10, reminderDays)).toBeNull();
    expect(reminderOffsetForToday(5, reminderDays)).toBeNull();
  });

  it("respeta una configuracion distinta de offsets sin cambiar codigo", () => {
    expect(reminderOffsetForToday(7, [7, 1])).toBe(7);
    expect(reminderOffsetForToday(3, [7, 1])).toBeNull();
  });
});
