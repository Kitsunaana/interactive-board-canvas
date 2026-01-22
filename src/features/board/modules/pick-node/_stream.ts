import { generateRandomColor } from "@/shared/lib/color.ts";
import { left, right } from "@/shared/lib/either.ts";
import { _u, isNotNull, isNotUndefined } from "@/shared/lib/utils.ts";
import { isNull } from "lodash";
import * as rx from "rxjs";
import { shapes$ } from "../../model";
import { autoSelectionBounds$ } from "../../view-model/selection-bounds.ts";
import { getResizeHandlersPositions } from "../../view-model/shape-sketch.ts";
import { camera$ } from "../camera/index.ts";
import { context, createFormatterFoundNode, getPickedColor, isPickedCanvas, isPickedResizeHandler, isPickedSelectionBound, isPickedShape } from "./_core.ts";
import { drawScene } from "./_ui.ts";

export const selectionBoundsToPick$ = autoSelectionBounds$.pipe(rx.map((selectionBounds) => {
  if (isNull(selectionBounds)) return null

  return _u.merge(selectionBounds, {
    linesColor: {
      bottom: generateRandomColor(),
      right: generateRandomColor(),
      left: generateRandomColor(),
      top: generateRandomColor(),
    }
  })
}))

const resizeHandlersPropertiesToPick$ = autoSelectionBounds$.pipe(
  rx.withLatestFrom(camera$),
  rx.map(([selectionArea, camera]) => {
    if (isNull(selectionArea)) return null

    return {
      resizeHandlers: getResizeHandlersPositions({ rect: selectionArea.area, radius: 10, camera }),
      linesColor: {
        bottomRight: generateRandomColor(),
        bottomLeft: generateRandomColor(),
        topRight: generateRandomColor(),
        topLeft: generateRandomColor(),
      }
    }
  }),
  rx.startWith(null)
)

export const createPointerNodePick$ = (pointer$: rx.Observable<PointerEvent>) =>
  pointer$.pipe(
    rx.withLatestFrom(shapes$, camera$, selectionBoundsToPick$, resizeHandlersPropertiesToPick$),
    rx.map(([event, shapes, camera, selectionBounds, resizeHandlers]) => ({
      event, shapes, camera, context, selectionBounds, resizeHandlers
    })),
    rx.tap((params) => drawScene(params)),
    rx.switchMap(({ camera, context, event, shapes, selectionBounds, resizeHandlers }) => {
      const { colorId, point } = getPickedColor({ context, camera, event })
      const format = createFormatterFoundNode({ colorId, point, event })

      return rx.from([
        () => isPickedCanvas(colorId),
        () => isPickedResizeHandler(colorId, resizeHandlers),
        () => isPickedSelectionBound(colorId, selectionBounds),
        () => isPickedShape(colorId, shapes)
      ]).pipe(
        rx.concatMap((fn) => rx.of(fn())),
        rx.find(res => res.type === "right"),
        rx.switchMap((either) => isNotUndefined(either)
          ? rx.of(right(format(either.value)))
          : rx.of(left(format(null)))
        )
      )
    }),
    rx.filter((either) => either.type === "right"),
    rx.map(either => either.value),
    rx.shareReplay({ refCount: true, bufferSize: 1 }),
  )

