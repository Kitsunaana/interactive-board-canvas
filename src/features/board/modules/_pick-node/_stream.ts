import { initialCanvas } from "@/shared/lib/initial-canvas.ts";
import { defer, fromEvent, map, Observable, shareReplay, tap, withLatestFrom } from "rxjs";
import { nodes$ } from "../../domain/node.ts";
import { cameraSubject$ } from "../_camera";
import { context, findNodeByColorId } from "./_core.ts";
import { renderHelperNodes } from "./loop.ts";

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

export const createPointerNodePick$ = (pointer$: Observable<PointerEvent>) =>
  pointer$.pipe(
    withLatestFrom(defer(() => nodes$), cameraSubject$),
    map(([event, nodes, { camera }]) => ({ event, nodes, camera, context })),
    tap(({ nodes, ...params }) => {
      renderHelperNodes({
        stickers: nodes.filter(node => node.type === "sticker"),
        ...params,
      })
    }),
    map(findNodeByColorId),
    shareReplay({ refCount: true, bufferSize: 1 }),
  )

export const mouseDown$ = createPointerNodePick$(pointerDown$)
export const mouseMove$ = createPointerNodePick$(pointerMove$)
export const mouseUp$ = createPointerNodePick$(pointerUp$)

