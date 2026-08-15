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
    let gestureInList = false;
    let startScrollTop = 0;
    let dragDistance = 0;
    let gestureMoved = false;

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
      gestureInList = Boolean(target?.closest(".sheet-scroll-region"));
      const activeScrollRegion = scrollRegionRef.current ?? scrollRegion;
      startScrollTop = gestureInList ? activeScrollRegion.scrollTop : 0;
      dragDistance = 0;
      gestureMoved = false;
      gsap.killTweensOf(sheet);
      gsap.killTweensOf(backdrop);
      gsap.set(backdrop, { autoAlpha: 1 });
      if (typeof sheet.setPointerCapture === "function") {
        try {
          sheet.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture can fail in embedded browsers; document listeners still handle the gesture.
        }
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const distance = event.clientY - startY;
      if (Math.abs(distance) > DRAG_START_DISTANCE_PX) gestureMoved = true;
      if (gestureInList) {
        const activeScrollRegion = scrollRegionRef.current ?? scrollRegion;
        const maxScrollTop = Math.max(0, activeScrollRegion.scrollHeight - activeScrollRegion.clientHeight);
        const nextScrollTop = Math.max(0, Math.min(maxScrollTop, startScrollTop - distance));
        const consumedDownwardDistance = startScrollTop - nextScrollTop;
        const overscrollDistance = distance - consumedDownwardDistance;

        if (!dragging && overscrollDistance <= DRAG_START_DISTANCE_PX) {
          if (distance !== 0) event.preventDefault();
          activeScrollRegion.scrollTop = nextScrollTop;
          return;
        }

        dragDistance = Math.max(0, overscrollDistance);
      } else {
        dragDistance = Math.max(0, distance);
      }

      if (!dragging && dragDistance <= DRAG_START_DISTANCE_PX) return;
      dragging = true;
      event.preventDefault();
      const panelHeight = sheet.getBoundingClientRect().height;
      gsap.set(sheet, { y: Math.min(dragDistance, panelHeight + 32) });
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const distance = dragDistance;
      const elapsed = Math.max(1, performance.now() - startTime);
      const velocity = distance / elapsed;
      const panelHeight = sheet.getBoundingClientRect().height;
      const dismiss = dragging && shouldDismissBottomSheet(distance, velocity, panelHeight);
      const wasDragging = dragging;
      const wasMoved = gestureMoved;
      if (typeof sheet.hasPointerCapture === "function" && sheet.hasPointerCapture(event.pointerId)) {
        try {
          sheet.releasePointerCapture(event.pointerId);
        } catch {
          // The browser may release capture automatically before pointerup.
        }
      }
      dragging = false;
      pointerId = null;
      gestureInList = false;
      startScrollTop = 0;
      dragDistance = 0;
      gestureMoved = false;

      if (!dismiss) {
        if (wasDragging || wasMoved) suppressClickUntil = Date.now() + 350;
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
      gestureInList = false;
      startScrollTop = 0;
      dragDistance = 0;
      gestureMoved = false;
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
