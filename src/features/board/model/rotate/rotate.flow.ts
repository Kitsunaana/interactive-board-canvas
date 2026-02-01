import { getPointFromEvent, screenToCanvasV2 } from "@/shared/lib/point";
import { isNotNull } from "@/shared/lib/utils";
import * as rx from "rxjs";
import { camera$ } from "../../modules/camera";
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$ } from "../../modules/pick-node";
import { selectionBounds$ } from "../../view-model/selection-bounds";
import { isIdle, shapesToRender$, viewState$ } from "../../view-model/state";
import { isShapesRotate } from "../../view-model/state/_view-model.type";
import { getMultipleShapesRotateStrategy } from "./rotate-multiple.core";
import { getSingleShapeRotateStrategy } from "./rotate-single.core";

export const shapesRotateFlow$ = mouseDown$.pipe(
  rx.filter((event) => event.node.type === "rotate-handler"),

  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle)),
    selectionBounds$.pipe(rx.filter(isNotNull), rx.map((value) => value.area)),
    shapesToRender$,
    camera$,
  ),

  rx.switchMap(([{ event }, idleState, area, shapes, camera]) => {
    const startCursor = screenToCanvasV2(getPointFromEvent(event), camera)

    const shapeRotateStrategy = (idleState.selectedIds.size > 1 ? getMultipleShapesRotateStrategy : getSingleShapeRotateStrategy)({
      area, shapes, startCursor
    })

    viewState$.next(shapeRotateStrategy.goToRotate(idleState.selectedIds))

    return pointerMove$.pipe(
      rx.withLatestFrom(viewState$.pipe(rx.filter(isShapesRotate))),
      rx.map(([event, state]) => {
        const currentCursor = screenToCanvasV2(getPointFromEvent(event), camera)

        const rotated = shapeRotateStrategy.rotate({ state, currentCursor })
        viewState$.next(rotated.nextState(state))

        return rotated.nextShapes()
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$).pipe(rx.tap(() => {
        shapeRotateStrategy.finish()
      })))
    )
  })
)
