"use client";

import { gsap, useGSAP } from "@/shared/lib/gsap-client";

const DISMISS_DISTANCE_RATIO = 0.25;
const DISMISS_VELOCITY_PX_PER_MS = 0.6;

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
    let dragSource: "static" | "list" | null = null;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resetPosition = () => {
      if (reducedMotion) {
        gsap.set(sheet, { y: 0 });
        gsap.set(backdrop, { opacity: "" });
        return;
      }
      gsap.to(sheet, { y: 0, duration: 0.22, ease: "power2.out" });
      gsap.to(backdrop, { opacity: 1, duration: 0.22, ease: "power2.out" });
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (window.matchMedia("(min-width: 641px)").matches) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, a, .sheet-search")) return;

      const startedInList = Boolean(target?.closest(".sheet-scroll-region"));
      if (startedInList && scrollRegion.scrollTop > 0) return;

      startY = event.clientY;
      startTime = performance.now();
      pointerId = event.pointerId;
      dragging = false;
      dragSource = startedInList ? "list" : "static";
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      if (dragSource === "list" && scrollRegion.scrollTop > 0) return;
      const distance = event.clientY - startY;
      if (distance <= 0) return;
      dragging = true;
      event.preventDefault();
      if (pointerId !== null && typeof sheet.setPointerCapture === "function") sheet.setPointerCapture(pointerId);
      const panelHeight = sheet.getBoundingClientRect().height;
      const progress = Math.min(distance / panelHeight, 1);
      gsap.set(sheet, { y: distance });
      gsap.set(backdrop, { opacity: 1 - progress * 0.7 });
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
      dragSource = null;

      if (!dismiss) {
        resetPosition();
        return;
      }

      if (reducedMotion) {
        onClose();
        return;
      }

      gsap.to(sheet, {
        y: panelHeight + 32,
        duration: 0.2,
        ease: "power2.in",
        onComplete: onClose,
      });
      gsap.to(backdrop, { opacity: 0, duration: 0.2, ease: "power2.in" });
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
      dragSource = null;
      resetPosition();
    };

    const safePointerDown = contextSafe ? contextSafe(handlePointerDown) : handlePointerDown;
    const safePointerMove = contextSafe ? contextSafe(handlePointerMove) : handlePointerMove;
    const safePointerUp = contextSafe ? contextSafe(handlePointerUp) : handlePointerUp;
    const safePointerCancel = contextSafe ? contextSafe(handlePointerCancel) : handlePointerCancel;

    sheet.addEventListener("pointerdown", safePointerDown);
    sheet.addEventListener("pointermove", safePointerMove, { passive: false });
    sheet.addEventListener("pointerup", safePointerUp);
    sheet.addEventListener("pointercancel", safePointerCancel);

    return () => {
      sheet.removeEventListener("pointerdown", safePointerDown);
      sheet.removeEventListener("pointermove", safePointerMove);
      sheet.removeEventListener("pointerup", safePointerUp);
      sheet.removeEventListener("pointercancel", safePointerCancel);
      gsap.killTweensOf(sheet);
      gsap.killTweensOf(backdrop);
    };
  }, { scope: sheetRef, dependencies: [backdropRef, onClose, scrollRegionRef, sheetRef], revertOnUpdate: true });
}
