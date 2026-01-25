import { initialCanvas } from "@/shared/lib/initial-canvas.ts";
import * as rx from "rxjs";
import { createPointerNodePick$ } from "./_stream";

export const [, canvas] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "canvas",
})

export const windowPointerLeave$ = rx.fromEvent<PointerEvent>(window, "pointerleave")
export const windowPointerMove$ = rx.fromEvent<PointerEvent>(window, "pointermove")
export const windowPointerDown$ = rx.fromEvent<PointerEvent>(window, "pointerdown")
export const windowPointerUp$ = rx.fromEvent<PointerEvent>(window, "pointerup")
export const windowWheel$ = rx.fromEvent<WheelEvent>(window, "wheel", { passive: true })

export const windowMouseDown$ = createPointerNodePick$(windowPointerDown$).pipe(rx.shareReplay({ refCount: true, bufferSize: 1 }))
export const windowMouseMove$ = createPointerNodePick$(windowPointerMove$).pipe(rx.shareReplay({ refCount: true, bufferSize: 1 }))
export const windowMouseUp$ = createPointerNodePick$(windowPointerUp$).pipe(rx.shareReplay({ refCount: true, bufferSize: 1 }))

export const cavnasPointerLeave$ = rx.fromEvent<PointerEvent>(canvas, "pointerleave")
export const canvasPointerMove$ = rx.fromEvent<PointerEvent>(canvas, "pointermove")
export const canvasPointerDown$ = rx.fromEvent<PointerEvent>(canvas, "pointerdown")
export const canvasPointerUp$ = rx.fromEvent<PointerEvent>(canvas, "pointerup")
export const canvasWheel$ = rx.fromEvent<WheelEvent>(canvas, "wheel", { passive: true })

export const canvasMouseDown$ = createPointerNodePick$(canvasPointerDown$).pipe(rx.shareReplay({ refCount: true, bufferSize: 1 }))
export const canvasMouseMove$ = createPointerNodePick$(canvasPointerMove$).pipe(rx.shareReplay({ refCount: true, bufferSize: 1 }))
export const canvasMouseUp$ = createPointerNodePick$(canvasPointerUp$).pipe(rx.shareReplay({ refCount: true, bufferSize: 1 }))