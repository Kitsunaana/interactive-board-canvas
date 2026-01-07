import { initialCanvas } from "@/shared/lib/initial-canvas.ts";
import { map, Observable, shareReplay, tap, withLatestFrom } from "rxjs";
import { nodes$ } from "../../domain/node.ts";
import { camera$ } from "../_camera/_stream.ts";
import { context, findNodeByColorId } from "./_core.ts";
import { renderHelperNodes } from "./loop.ts";

export const [_, canvas] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "canvas",
})

export const createPointerNodePick$ = (pointer$: Observable<PointerEvent>) =>
  pointer$.pipe(
    withLatestFrom(nodes$, camera$),
    map(([event, nodes, camera]) => ({ event, nodes, camera, context })),
    tap(({ nodes, ...params }) => {
      renderHelperNodes({
        stickers: nodes.filter(node => node.type === "sticker"),
        ...params,
      })
    }),
    map(findNodeByColorId),
    shareReplay({ refCount: true, bufferSize: 1 }),
  )

