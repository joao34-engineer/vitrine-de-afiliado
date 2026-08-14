import { render } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  gsapSet: vi.fn(),
  gsapKill: vi.fn(),
  gsapTo: vi.fn(() => ({ kill: mocks.gsapKill })),
  useGSAP: vi.fn((callback: () => void) => useEffect(callback, [callback])),
}));

vi.mock("@/shared/lib/gsap-client", () => ({
  gsap: { set: mocks.gsapSet, to: mocks.gsapTo },
  useGSAP: mocks.useGSAP,
}));

import { ScrollRevealHairline } from "./scroll-reveal-hairline";

describe("scroll reveal hairline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  });

  it("renders as decorative content and configures the 140px scrub", () => {
    const { container } = render(<ScrollRevealHairline className="department-hairline" />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    expect(mocks.gsapTo).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({
      scrollTrigger: expect.objectContaining({ start: 0, end: 140, scrub: 0.4 }),
    }));
  });

  it("uses a static scroll listener for reduced motion", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    render(<ScrollRevealHairline className="department-hairline" />);
    expect(mocks.gsapTo).not.toHaveBeenCalled();
  });

  it("cleans up the GSAP tween on unmount", () => {
    const view = render(<ScrollRevealHairline className="department-hairline" />);

    view.unmount();

    expect(mocks.gsapKill).toHaveBeenCalledTimes(1);
  });
});
