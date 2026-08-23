export interface PlantingWindowConfig {
  startMonth: number; // 1-12
  endMonth: number; // 1-12, may be < startMonth to represent a window that wraps December
  label: string;
}

export interface PlantingWindowCheck {
  inWindow: boolean;
  message?: string;
}

/**
 * Non-blocking advisory check only — a date outside the window produces a
 * warning message for the admin to see and can be acknowledged/overridden;
 * it never blocks crop creation and never changes the entered date.
 */
export function checkPlantingWindow(
  date: Date,
  window: PlantingWindowConfig,
  plantingTypeLabel: string
): PlantingWindowCheck {
  const month = date.getMonth() + 1;
  const { startMonth, endMonth, label } = window;

  const inWindow =
    startMonth <= endMonth
      ? month >= startMonth && month <= endMonth
      : month >= startMonth || month <= endMonth; // wraps across December

  if (inWindow) return { inWindow: true };

  return {
    inWindow: false,
    message: `This date falls outside the recommended ${plantingTypeLabel} window (${label}). You can continue, but double-check the planting type.`,
  };
}
