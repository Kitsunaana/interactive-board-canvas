import { generateRandomColor, toRGB } from "@/shared/lib/color.ts";
import { isRight, left, right } from "@/shared/lib/either.ts";
import { _u, isNegative, isNotUndefined } from "@/shared/lib/utils.ts";
import type { Rect } from "@/shared/type/shared.ts";
import { isNull } from "lodash";
import * as rx from "rxjs";
import { shapes$ } from "../../model/shapes.ts";
import { autoSelectionBounds$ } from "../../view-model/selection-bounds.ts";
import { getResizeCorners } from "../../view-model/shape-sketch.ts";
import { selectionWindow$ } from "../../view-model/state/_view-model.ts";
import { camera$, type Camera } from "../camera/index.ts";
import { context, createFormatterFoundNode, getPickedColor, isPickedCanvas, isPickedResizeHandler, isPickedSelectionBound, isPickedShape } from "./_core.ts";
import { CANVAS_COLOR_ID, drawScene } from "./_ui.ts";

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
      resizeHandlers: getResizeCorners({ rect: selectionArea.area, radius: 10, camera }),
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

function rectBorderPointsStep(x: number, y: number, width: number, height: number, step = 5) {
  const points = []

  for (let i = 0; i < width; i += step) {
    points.push({ x: x + i, y })
    points.push({ x: x + i, y: y + height - 1 })
  }

  for (let i = step; i < height - step; i += step) {
    points.push({ x, y: y + i })
    points.push({ x: x + width - 1, y: y + i })
  }

  return points
}

const canvasRectToScreen = (rect: Rect, camera: Camera) => {
  const x = Math.round((rect.x * camera.scale) + camera.x)
  const y = Math.round((rect.y * camera.scale) + camera.y)
  const height = Math.round(rect.height * camera.scale)
  const width = Math.round(rect.width * camera.scale)

  return {
    x: isNegative(width) ? x - Math.abs(width) : x,
    y: isNegative(height) ? y - Math.abs(height) : y,
    width: Math.abs(width),
    height: Math.abs(height),
  }
}

export const createPointerNodePick$ = (pointer$: rx.Observable<PointerEvent>) =>
  pointer$.pipe(
    rx.withLatestFrom(shapes$, camera$, selectionBoundsToPick$, resizeHandlersPropertiesToPick$, selectionWindow$),
    rx.map(([event, shapes, camera, selectionBounds, resizeHandlers, selectionWindow]) => ({
      event, shapes, camera, context, selectionBounds, resizeHandlers, selectionWindow
    })),
    rx.tap((params) => drawScene(params)),
    rx.switchMap(({ camera, context, event, shapes, selectionBounds, resizeHandlers, selectionWindow }) => {
      const { colorId, point } = getPickedColor({ context, camera, event })
      const format = createFormatterFoundNode({ colorId, point, event })

      // if (isNotUndefined(selectionWindow) && selectionWindow.width !== 0 && selectionWindow.height !== 0) {
      //   const { height, width, x, y } = canvasRectToScreen(selectionWindow, camera)

      //   const selectionWindowBorderPoints = rectBorderPointsStep(x, y, width, height, 1)
      //   const colors = new Set<string>()

      //   for (const point of selectionWindowBorderPoints) {
      //     const [r, g, b] = context.getImageData(point.x, point.y, 1, 1).data
      //     colors.add(toRGB(r, g, b))
      //   }

      //   const r = Array.from(colors).map((colorId) => isPickedShape(colorId, shapes)).filter(isRight)
      
      //   console.log(r)
      // }


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

