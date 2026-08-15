"use client";

import { gsap, useGSAP } from "@/shared/lib/gsap-client";

const DISMISS_DISTANCE_RATIO = 0.25;
const DISMISS_VELOCITY_PX_PER_MS = 0.6;
const DRAG_START_DISTANCE_PX = 6;

export function shouldDismissBottomSheet(distance: number, velocity: number, height: number): boolean {
  return distance >= height * DISMISS_DISTANCE_RATIO || velocity >= DISMISS_VELOCITY_PX_PER_MS;
}

export function useBottomSheetDismiss({
  sheetRef,
  scrollRegionRef,
  backdropRef,
  onClose,
}: Readonly<{
  sheetRef: React.RefObject<HTMLElement | null>;
  scrollRegionRef: React.RefObject<HTMLElement | null>;
  backdropRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}>): void {
  useGSAP((_, contextSafe) => {
    const sheet = sheetRef.current;
    const scrollRegion = scrollRegionRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !scrollRegion || !backdrop) return;

    let startY = 0;
    let startTime = 0;
    let dragging = false;
    let pointerId: number | null = null;
    let suppressClickUntil = 0;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resetPosition = () => {
      if (reducedMotion) {
        gsap.set(sheet, { y: 0 });
        return;
      }
      gsap.to(sheet, { y: 0, duration: 0.22, ease: "power2.out" });
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (window.matchMedia("(min-width: 641px)").matches) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;

      startY = event.clientY;
      startTime = performance.now();
      pointerId = event.pointerId;
      dragging = false;
      gsap.killTweensOf(sheet);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const distance = event.clientY - startY;
      if (distance <= DRAG_START_DISTANCE_PX) return;
      dragging = true;
      event.preventDefault();
      if (pointerId !== null && typeof sheet.setPointerCapture === "function") sheet.setPointerCapture(pointerId);
      gsap.set(sheet, { y: distance });
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const distance = Math.max(0, event.clientY - startY);
      const elapsed = Math.max(1, performance.now() - startTime);
      const velocity = distance / elapsed;
      const panelHeight = sheet.getBoundingClientRect().height;
      const dismiss = dragging && shouldDismissBottomSheet(distance, velocity, panelHeight);
      if (typeof sheet.hasPointerCapture === "function" && sheet.hasPointerCapture(event.pointerId)) {
        try {
          sheet.releasePointerCapture(event.pointerId);
        } catch {
          // The browser may release capture automatically before pointerup.
        }
      }
      dragging = false;
      pointerId = null;

      if (!dismiss) {
        resetPosition();
        return;
      }

      suppressClickUntil = Date.now() + 350;

      if (reducedMotion) {
        onClose();
        return;
      }

      gsap.to(sheet, {
        y: panelHeight + 32,
        duration: 0.24,
        ease: "power2.in",
        onComplete: onClose,
      });
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (pointerId === null) return;
      if (typeof sheet.hasPointerCapture === "function" && sheet.hasPointerCapture(event.pointerId)) {
        try {
          sheet.releasePointerCapture(event.pointerId);
        } catch {
          // The browser may release capture automatically before pointercancel.
        }
      }
      dragging = false;
      pointerId = null;
      resetPosition();
    };

    const handleClick = (event: MouseEvent) => {
      if (Date.now() >= suppressClickUntil) return;
      suppressClickUntil = 0;
      event.preventDefault();
      event.stopPropagation();
    };

    const safePointerDown = contextSafe ? contextSafe(handlePointerDown) : handlePointerDown;
    const safePointerMove = contextSafe ? contextSafe(handlePointerMove) : handlePointerMove;
    const safePointerUp = contextSafe ? contextSafe(handlePointerUp) : handlePointerUp;
    const safePointerCancel = contextSafe ? contextSafe(handlePointerCancel) : handlePointerCancel;
    const safeClick = contextSafe ? contextSafe(handleClick) : handleClick;

    sheet.addEventListener("pointerdown", safePointerDown);
    sheet.addEventListener("pointermove", safePointerMove, { passive: false });
    sheet.addEventListener("pointerup", safePointerUp);
    sheet.addEventListener("pointercancel", safePointerCancel);
    sheet.addEventListener("click", safeClick);

    return () => {
      sheet.removeEventListener("pointerdown", safePointerDown);
      sheet.removeEventListener("pointermove", safePointerMove);
      sheet.removeEventListener("pointerup", safePointerUp);
      sheet.removeEventListener("pointercancel", safePointerCancel);
      sheet.removeEventListener("click", safeClick);
      gsap.killTweensOf(sheet);
      gsap.killTweensOf(backdrop);
    };
  }, { scope: sheetRef, dependencies: [backdropRef, onClose, scrollRegionRef, sheetRef], revertOnUpdate: true });
}
