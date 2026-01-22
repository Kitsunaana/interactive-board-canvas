import { initialCanvas } from "@/shared/lib/initial-canvas.ts";
import * as rx from "rxjs";
import { createPointerNodePick$ } from "./_stream";

export const [, canvas] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "canvas",
})

export const pointerLeave$ = rx.fromEvent<PointerEvent>(window, "pointerleave")
export const pointerMove$ = rx.fromEvent<PointerEvent>(window, "pointermove")
export const pointerDown$ = rx.fromEvent<PointerEvent>(window, "pointerdown")
export const pointerUp$ = rx.fromEvent<PointerEvent>(window, "pointerup")
export const wheel$ = rx.fromEvent<WheelEvent>(window, "wheel")

export const mouseDown$ = createPointerNodePick$(pointerDown$).pipe(rx.shareReplay({ refCount: true, bufferSize: 1 }))
export const mouseMove$ = createPointerNodePick$(pointerMove$).pipe(rx.shareReplay({ refCount: true, bufferSize: 1 }))
export const mouseUp$ = createPointerNodePick$(pointerUp$).pipe(rx.shareReplay({ refCount: true, bufferSize: 1 }))
