import { getAngleBetweenPoints, getPointFromEvent, screenToCanvasV2 } from "@/shared/lib/point";
import { centerPointFromRect } from "@/shared/lib/rect";
import { _u, isNotNull } from "@/shared/lib/utils";
import * as rx from "rxjs";
import { camera$ } from "../modules/camera";
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$ } from "../modules/pick-node";
import { selectionBounds$ } from "../view-model/selection-bounds";
import { isIdle, shapesToRender$, viewState$ } from "../view-model/state";
import type { ClientShape } from "@/entities/shape/model/types";
import { markDirty } from "@/entities/shape/model/render-state";
import { goToShapesRotate, isShapesRotate } from "../view-model/state/_view-model.type";

export const shapesRotateFlow$ = mouseDown$.pipe(
  rx.filter((event) => event.node.type === "rotate-handler"),

  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle)),
    selectionBounds$.pipe(rx.filter(isNotNull)),
    shapesToRender$,
    camera$,
  ),

  rx.switchMap(([{ event }, idleState, selectionArea, shapes, camera]) => {
    const cursorInCanvas = screenToCanvasV2(getPointFromEvent(event), camera)
    const center = centerPointFromRect(selectionArea.area)

    const startCursorAngle = getAngleBetweenPoints(center, cursorInCanvas)
    const rotatingShape = shapes.find((shape) => shape.client.isSelected) as ClientShape
    const startRotation = rotatingShape.transform.rotate

    rotatingShape.client.renderMode.kind = "vector"

    viewState$.next(goToShapesRotate({ selectedIds: idleState.selectedIds }))

    return pointerMove$.pipe(
      rx.withLatestFrom(viewState$),
      rx.filter(([, state]) => isShapesRotate(state)),
      rx.map(([event]) => {
        const cursorInCanvas = screenToCanvasV2(getPointFromEvent(event), camera)
        const currentCursorAngle = getAngleBetweenPoints(center, cursorInCanvas)

        const delta = currentCursorAngle - startCursorAngle
        const nextRotation = startRotation + delta

        return shapes.map((shape) => {
          if (shape.client.isSelected) {
            return {
              ...shape,
              transform: _u.merge(shape.transform, { rotate: nextRotation })
            }
          }

          return shape
        })
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$).pipe(rx.tap(() => {
        markDirty(rotatingShape)
      })))
    )
  })
)
