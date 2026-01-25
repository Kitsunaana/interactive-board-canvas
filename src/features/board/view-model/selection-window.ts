import { toRGB } from "@/shared/lib/color";
import { isRight } from "@/shared/lib/either";
import { pointToSizes, subtractPoint } from "@/shared/lib/point";
import { isRectIntersectionV2, normalizeRect, rectBorderPointsStep, worldRectToScreenRect } from "@/shared/lib/rect";
import { _u, isNotUndefined } from "@/shared/lib/utils";
import type { Point } from "@/shared/type/shared";
import { isNull } from "lodash";
import * as rx from "rxjs";
import { isCanvas } from "../domain/is";
import type { ShapeToRender } from "../domain/shape";
import { camera$, type Camera } from "../modules/camera";
import { pointerUp$ } from "../modules/pick-node";
import { context, isPickedShape } from "../modules/pick-node/_core";
import { canvasMouseDown$, canvasMouseMove$ } from "../modules/pick-node/_events";
import { selectionBounds$ } from "./selection-bounds";
import { shapesToRender$, viewState$ } from "./state";
import { goToSelectionWindow, isIdle } from "./state/_view-model.type";

const resolveSelectionWindowSelection = ({ startPoint, endPoint, shapes, camera }: {
  shapes: ShapeToRender[]
  startPoint: Point
  endPoint: Point
  camera: Camera
}) => {
  const selectionWindow = _u.merge(startPoint, pointToSizes(subtractPoint(startPoint, endPoint)))

  if (isNotUndefined(selectionWindow) && selectionWindow.width !== 0 && selectionWindow.height !== 0) {
    const selectionWindowScreenRect = worldRectToScreenRect(selectionWindow, camera)
    const selectionBorderSamplePoints = rectBorderPointsStep(selectionWindowScreenRect, 1)

    const colors = new Set<string>()

    for (const point of selectionBorderSamplePoints) {
      const [r, g, b] = context.getImageData(point.x, point.y, 1, 1).data
      colors.add(toRGB(r, g, b))
    }

    const borderHitShapeIds = Array
      .from(colors)
      .map((colorId) => isPickedShape(colorId, shapes))
      .filter(((item) => isRight(item)))
      .map((shape) => shape.value.id)


    const fullyContainedShapeIds = shapes
      .filter((shape) => isRectIntersectionV2({
        rect: normalizeRect(selectionWindow),
        point: shape,
      }))
      .map(shape => shape.id)

    return {
      selectedIds: new Set(borderHitShapeIds.concat(fullyContainedShapeIds)),
      startPoint,
      endPoint,
    }
  }

  return {
    startPoint,
    endPoint,
  }
}

const selectionWindowFlow$ = canvasMouseDown$.pipe(
  rx.filter((event) => isCanvas(event.node) && event.event.button === 0),
  rx.withLatestFrom(viewState$.pipe(rx.filter(isIdle)), shapesToRender$),
  rx.switchMap((params) => {
    return rx.of(params).pipe(
      rx.withLatestFrom(
        selectionBounds$.pipe(rx.filter((selectionBounds) => isNull(selectionBounds) || !isRectIntersectionV2({
          rect: selectionBounds.area,
          point: params[0].point,
        })))
      ),
      rx.map(() => params)
    )
  }),
  rx.exhaustMap(([downEvent, _, shapes]) => {
    const startPoint = downEvent.point

    return canvasMouseMove$.pipe(
      rx.withLatestFrom(camera$),
      rx.tap(([moveEvent, camera]) => {
        const endPoint = moveEvent.point

        viewState$.next(
          goToSelectionWindow(resolveSelectionWindowSelection({
            startPoint,
            endPoint,
            camera,
            shapes,
          }))
        )
      }),
      rx.takeUntil(pointerUp$),
    )
  })
)

selectionWindowFlow$.subscribe()
