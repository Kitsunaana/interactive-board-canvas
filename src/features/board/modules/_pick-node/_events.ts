import { initialCanvas } from "@/shared/lib/initial-canvas.ts";
import * as rx from "rxjs"
import { createPointerNodePick$ } from "./_stream";

export const [_, canvas] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "canvas",
})

export const pointerLeave$ = rx.fromEvent<PointerEvent>(canvas, "pointerleave")
export const pointerMove$ = rx.fromEvent<PointerEvent>(canvas, "pointermove")
export const pointerDown$ = rx.fromEvent<PointerEvent>(canvas, "pointerdown")
export const pointerUp$ = rx.fromEvent<PointerEvent>(canvas, "pointerup")
export const wheel$ = rx.fromEvent<WheelEvent>(canvas, "wheel")

export const mouseDown$ = createPointerNodePick$(pointerDown$)
export const mouseMove$ = createPointerNodePick$(pointerMove$)
export const mouseUp$ = createPointerNodePick$(pointerUp$)
