import { generateRandomColor } from "@/shared/lib/color.ts";
import { matchEither } from "@/shared/lib/either.ts";
import { _u, isNotUndefined } from "@/shared/lib/utils.ts";
import * as rx from "rxjs";
import { shapes$ } from "../../model/index.ts";
import { selectionBounds$ } from "../../view-model/state/_view-model.ts";
import { camera$ } from "../_camera/_stream.ts";
import { context, createFormatterFoundNode, getPickedColor, isPickedCanvas, isPickedSelectionBound, isPickedShape, type SelectionBoundsToPick } from "./_core.ts";
import { drawScene } from "./_ui.ts";

export const selectionBoundsToPick$ = selectionBounds$.pipe(rx.map((selectionBounds) => matchEither(selectionBounds, {
  left: () => null,
  right: (value): SelectionBoundsToPick => _u.merge(value, {
    linesColor: {
      bottom: generateRandomColor(),
      right: generateRandomColor(),
      left: generateRandomColor(),
      top: generateRandomColor(),
    }
  }),
})))

export const createPointerNodePick$ = (pointer$: rx.Observable<PointerEvent>) =>
  pointer$.pipe(
    rx.withLatestFrom(shapes$, camera$, selectionBoundsToPick$),
    rx.map(([event, shapes, camera, selectionBounds]) => ({ event, shapes, camera, context, selectionBounds })),
    rx.tap((params) => drawScene(params)),
    rx.switchMap(({ camera, context, event, shapes, selectionBounds }) => {
      const { colorId, point } = getPickedColor({ context, camera, event })
      const format = createFormatterFoundNode({ colorId, point, event })

      return rx.from([
        () => isPickedCanvas(colorId),
        () => isPickedSelectionBound(colorId, selectionBounds),
        () => isPickedShape(colorId, shapes)
      ]).pipe(
        rx.concatMap((fn) => rx.of(fn())),
        rx.find(res => res.type === "right"),
        rx.switchMap(right => (
          isNotUndefined(right)
            ? rx.of(format(right.value))
            : rx.throwError(() => new Error("Nothing found"))
        ))
      )
    }),
    rx.shareReplay({ refCount: true, bufferSize: 1 }),
  )

