import { markDirtySelectedShapes } from "@/entities/shape/model/render-state"
import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point"
import { isNotNull } from "@/shared/lib/utils"
import * as rx from "rxjs"
import type { Bound } from "../../domain/selection-area"
import { camera$ } from "../../modules/camera"
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$ } from "../../modules/pick-node"
import { autoSelectionBounds$, pressedResizeHandlerSubject$ } from "../../view-model/selection-bounds"
import { goToIdle, goToShapesResize, isIdle, isShapesResize, shapesToRender$, viewState$ } from "../../view-model/state"
import { shapes$ } from "../shapes"
import { getShapesResizeViaBoundStrategy } from "./_strategy"

const applyResizeViaBoundCursor = (node: Bound) => {
  document.documentElement.style.cursor = ({
    bottom: "ns-resize",
    right: "ew-resize",
    left: "ew-resize",
    top: "ns-resize",
  }[node])
}

const resetResizeCursor = () => {
  document.documentElement.style.cursor = "default"
}

export const shapesResizeFlowViaBound$ = mouseDown$.pipe(
  rx.map(event => event.node),
  rx.filter((node) => node.type === "bound"),
  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle), rx.map((state) => state.selectedIds)),
    autoSelectionBounds$.pipe(rx.filter(isNotNull), rx.map((selection) => selection.area)),
    shapesToRender$,
    camera$
  ),
  rx.map(([{ bound }, selectedIds, selectionArea, shapes, camera]) => ({ selectionArea, selectedIds, camera, shapes, handler: bound })),
  rx.switchMap(({ camera, handler, shapes, selectedIds, selectionArea }) => {
    const resizeShapesStrategy = getShapesResizeViaBoundStrategy({
      selectionArea,
      handler,
      shapes: shapes.map((shape) => {
        if (shape.client.isSelected) {
          shape.client.renderMode.kind = "vector"
        }

        return shape
      }),
    })

    const sharedMove$ = pointerMove$.pipe(rx.share())

    const resizeActivation$ = sharedMove$.pipe(
      rx.take(1),
      rx.tap(() => {
        applyResizeViaBoundCursor(handler)

        pressedResizeHandlerSubject$.next({ type: "bound", bound: handler })
        viewState$.next(goToShapesResize({ selectedIds }))
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
      rx.ignoreElements(),
    )

    const resizeProgress$ = sharedMove$.pipe(
      rx.map((moveEvent) => {
        const point = getPointFromEvent(moveEvent)
        const cursor = screenToCanvas({ camera, point })

        return resizeShapesStrategy({
          proportional: moveEvent.shiftKey,
          reflow: moveEvent.ctrlKey,
          cursor,
        })
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
    )

    const resizeCommit$ = rx.merge(pointerLeave$, pointerUp$).pipe(
      rx.withLatestFrom(viewState$),
      rx.filter(([_, state]) => isShapesResize(state)),
      rx.map(() => markDirtySelectedShapes(shapes$.getValue())),
      rx.tap(() => {
        viewState$.next(goToIdle({ selectedIds }))
        resetResizeCursor()
      })
    )

    return rx.merge(resizeActivation$, resizeProgress$, resizeCommit$)
  })
)