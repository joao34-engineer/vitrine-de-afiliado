import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib/gsap-client", () => ({
  gsap: { set: vi.fn(), to: vi.fn(() => ({})), killTweensOf: vi.fn() },
}));

import { shouldDismissBottomSheet } from "./use-bottom-sheet-dismiss";

describe("bottom sheet dismiss thresholds", () => {
  it("dismisses after a quarter of the panel", () => {
    expect(shouldDismissBottomSheet(190, 0, 744)).toBe(true);
    expect(shouldDismissBottomSheet(180, 0, 744)).toBe(false);
  });

  it("dismisses on a fast downward gesture", () => {
    expect(shouldDismissBottomSheet(20, 0.6, 744)).toBe(true);
    expect(shouldDismissBottomSheet(20, 0.59, 744)).toBe(false);
  });
});
