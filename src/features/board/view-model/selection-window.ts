import { toRGB } from "@/shared/lib/color";
import { isRight, type Right } from "@/shared/lib/either";
import { _u, isNegative, isNotUndefined } from "@/shared/lib/utils";
import type { Rect } from "@/shared/type/shared";
import * as rx from "rxjs";
import { isCanvas } from "../domain/is";
import { camera$, type Camera } from "../modules/camera";
import { mouseDown$, mouseMove$, pointerUp$ } from "../modules/pick-node";
import { context, isPickedShape } from "../modules/pick-node/_core";
import { shapesToRender$, viewState$ } from "./state";
import { goToSelectionWindow, isIdle } from "./state/_view-model.type";
import type { Shape } from "../domain/shape";
import { pointToSizes, subtractPoint } from "@/shared/lib/point";
import { isRectIntersection, isRectIntersectionV2 } from "@/shared/lib/rect";

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

const reverseRect = ({ height, width, x, y }: Rect) => {
  return {
    x: isNegative(width) ? x - Math.abs(width) : x,
    y: isNegative(height) ? y - Math.abs(height) : y,
    width: Math.abs(width),
    height: Math.abs(height),
  }
}

mouseDown$.pipe(
  rx.filter((event) => isCanvas(event.node)),
  rx.withLatestFrom(viewState$.pipe(rx.filter(isIdle)), shapesToRender$),
  rx.exhaustMap(([downEvent, _, shapes]) => {
    const startPoint = downEvent.point

    return mouseMove$.pipe(
      rx.withLatestFrom(camera$),
      rx.tap(([moveEvent, camera]) => {
        const endPoint = moveEvent.point
        const selectionWindow = _u.merge(startPoint, pointToSizes(subtractPoint(startPoint, endPoint)))

        if (isNotUndefined(selectionWindow) && selectionWindow.width !== 0 && selectionWindow.height !== 0) {
          const { height, width, x, y } = canvasRectToScreen(selectionWindow, camera)

          const selectionWindowBorderPoints = rectBorderPointsStep(x, y, width, height, 1)
          const colors = new Set<string>()

          for (const point of selectionWindowBorderPoints) {
            const [r, g, b] = context.getImageData(point.x, point.y, 1, 1).data
            colors.add(toRGB(r, g, b))
          }

          const r = Array
            .from(colors)
            .map((colorId) => isPickedShape(colorId, shapes))
            .filter(isRight) as Array<Right<Shape>>

          const t = shapes
            .filter((shape) => isRectIntersectionV2({
              rect: reverseRect(selectionWindow),
              point: shape,
            }))
            .map(shape => shape.id)

          viewState$.next(goToSelectionWindow({
            selectedIds: new Set(r.map(right => right.value.id).concat(t)),
            startPoint,
            endPoint,
          }))

        }

      }),
      rx.takeUntil(pointerUp$),
    )
  })
)
  .subscribe()
