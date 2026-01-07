import { initialCanvas } from "@/shared/lib/initial-canvas.ts";
import { fromEvent } from "rxjs";
import { createPointerNodePick$ } from "./_stream";

export const [_, canvas] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "canvas",
})

export const pointerLeave$ = fromEvent<PointerEvent>(canvas, "pointerleave")
export const pointerMove$ = fromEvent<PointerEvent>(canvas, "pointermove")
export const pointerDown$ = fromEvent<PointerEvent>(canvas, "pointerdown")
export const pointerUp$ = fromEvent<PointerEvent>(canvas, "pointerup")
export const wheel$ = fromEvent<WheelEvent>(canvas, "wheel")

export const mouseDown$ = createPointerNodePick$(pointerDown$)
export const mouseMove$ = createPointerNodePick$(pointerMove$)
export const mouseUp$ = createPointerNodePick$(pointerUp$)

