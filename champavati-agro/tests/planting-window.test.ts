import { describe, expect, it } from "vitest";

import { checkPlantingWindow } from "@/lib/server/crop-timeline/planting-window";
import { getCropDefinition } from "@/lib/server/crop-timeline/crop-definitions";

const sugarcane = getCropDefinition("Sugarcane")!;
const windowFor = (type: string) => sugarcane.plantingWindows!.find((w) => w.plantingType === type)!;

describe("checkPlantingWindow — Sugarcane", () => {
  it("15 July + ADSALI is valid (Adsali window is Jul–Aug)", () => {
    const result = checkPlantingWindow(new Date("2026-07-15"), windowFor("ADSALI"), "Adsali");
    expect(result.inWindow).toBe(true);
  });

  it("15 July + SURU is NOT valid and produces a warning (Suru window is Jan–Feb)", () => {
    const result = checkPlantingWindow(new Date("2026-07-15"), windowFor("SURU"), "Suru");
    expect(result.inWindow).toBe(false);
    expect(result.message).toMatch(/Suru/i);
  });

  it("15 January + SURU is valid", () => {
    const result = checkPlantingWindow(new Date("2026-01-15"), windowFor("SURU"), "Suru");
    expect(result.inWindow).toBe(true);
  });

  it("15 October + PRE_SEASONAL is valid", () => {
    const result = checkPlantingWindow(new Date("2026-10-15"), windowFor("PRE_SEASONAL"), "Pre-seasonal");
    expect(result.inWindow).toBe(true);
  });

  it("never blocks — it only returns an advisory message, the check itself never throws", () => {
    expect(() => checkPlantingWindow(new Date("2026-03-01"), windowFor("ADSALI"), "Adsali")).not.toThrow();
  });
});

describe("checkPlantingWindow — wrap-around window", () => {
  it("handles a window that wraps December correctly", () => {
    const wrapping = { startMonth: 11, endMonth: 1, label: "Nov–Jan" };
    expect(checkPlantingWindow(new Date("2026-12-15"), wrapping, "Test").inWindow).toBe(true);
    expect(checkPlantingWindow(new Date("2026-01-05"), wrapping, "Test").inWindow).toBe(true);
    expect(checkPlantingWindow(new Date("2026-06-15"), wrapping, "Test").inWindow).toBe(false);
  });
});
