import { initialCanvas } from "@/shared/lib/initial-canvas.ts";
import { map, Observable, shareReplay, tap, withLatestFrom } from "rxjs";
import { shapes$ } from "../../domain/node.ts";
import { camera$ } from "../_camera/_stream.ts";
import { context, findNodeByColorId } from "./_core.ts";
import { renderHelperShapes } from "./loop.ts";

export const [_, canvas] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "canvas",
})

export const createPointerNodePick$ = (pointer$: Observable<PointerEvent>) =>
  pointer$.pipe(
    withLatestFrom(shapes$, camera$),
    map(([event, shapes, camera]) => ({ event, shapes, camera, context })),
    tap(({ camera, context, shapes }) => {
      context.save()

      context.clearRect(0, 0, context.canvas.width, context.canvas.height)

      context.translate(camera.x, camera.y)
      context.scale(camera.scale, camera.scale)

      renderHelperShapes({ context, shapes })

      context.restore()
    }),
    map(findNodeByColorId),
    shareReplay({ refCount: true, bufferSize: 1 }),
  )

