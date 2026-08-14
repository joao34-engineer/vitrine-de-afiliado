"use client";

import { useEffect } from "react";

import { gsap } from "@/shared/lib/gsap-client";

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
  useEffect(() => {
    const sheet = sheetRef.current;
    const scrollRegion = scrollRegionRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !scrollRegion || !backdrop) return;

    let startY = 0;
    let startTime = 0;
    let dragging = false;
    let pointerId: number | null = null;

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
      if (scrollRegion.scrollTop > 0) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, a")) return;
      startY = event.clientY;
      startTime = performance.now();
      pointerId = event.pointerId;
      dragging = false;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId || scrollRegion.scrollTop > 0) return;
      const distance = event.clientY - startY;
      if (distance <= 0) return;
      dragging = true;
      event.preventDefault();
      if (pointerId !== null) sheet.setPointerCapture(pointerId);
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
      dragging = false;
      pointerId = null;

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

    const handlePointerCancel = () => {
      if (pointerId === null) return;
      dragging = false;
      pointerId = null;
      resetPosition();
    };

    sheet.addEventListener("pointerdown", handlePointerDown);
    sheet.addEventListener("pointermove", handlePointerMove, { passive: false });
    sheet.addEventListener("pointerup", handlePointerUp);
    sheet.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      sheet.removeEventListener("pointerdown", handlePointerDown);
      sheet.removeEventListener("pointermove", handlePointerMove);
      sheet.removeEventListener("pointerup", handlePointerUp);
      sheet.removeEventListener("pointercancel", handlePointerCancel);
      gsap.killTweensOf(sheet);
      gsap.killTweensOf(backdrop);
    };
  }, [backdropRef, onClose, scrollRegionRef, sheetRef]);
}
