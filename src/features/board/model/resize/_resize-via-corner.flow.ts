import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point"
import { isNotNull } from "@/shared/lib/utils"
import * as rx from "rxjs"
import type { Corner } from "../../domain/selection-area"
import { camera$ } from "../../modules/camera"
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$ } from "../../modules/pick-node"
import { autoSelectionBounds$, pressedResizeHandlerSubject$ } from "../../view-model/selection-bounds"
import { goToIdle, goToShapesResize, isIdle, isShapesResize, shapesToRender$, viewState$ } from "../../view-model/state"
import { getShapesResizeViaCornerStrategy } from "./_strategy"
import { markDirtySelectedShapes } from "@/entities/shape/model/render-state"
import { shapes$ } from "../shapes"

const applyResizeViaCornerCursor = (node: Corner) => {
  document.documentElement.style.cursor = {
    bottomRight: "ns-resize",
    bottomLeft: "ew-resize",
    topRight: "ew-resize",
    topLeft: "ns-resize",
  }[node]
}

const resetResizeCursor = () => {
  document.documentElement.style.cursor = "default"
}

export const shapesResizeViaCorner$ = mouseDown$.pipe(
  rx.map((downEvent) => downEvent.node),
  rx.filter(node => node.type === "corner"),
  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle), rx.map((state) => state.selectedIds)),
    autoSelectionBounds$.pipe(rx.filter(isNotNull), rx.map((selection) => selection.area)),
    shapesToRender$,
    camera$
  ),
  rx.map(([handler, selectedIds, selectionArea, shapes, camera]) => ({ selectionArea, selectedIds, camera, shapes, handler })),
  rx.switchMap(({ camera, handler, shapes, selectedIds, selectionArea }) => {
    const sharedMove$ = pointerMove$.pipe(rx.share())

    const resizeShapesStrategy = getShapesResizeViaCornerStrategy({
      selectionArea,
      handler: handler.corner,
      shapes: shapes.map((shape) => {
        if (shape.client.isSelected) shape.client.renderMode.kind = "vector"

        return shape
      }),
    })

    const resizeActivation$ = sharedMove$.pipe(
      rx.take(1),
      rx.tap(() => {
        applyResizeViaCornerCursor(handler.corner)

        pressedResizeHandlerSubject$.next(handler)
        viewState$.next(goToShapesResize({ selectedIds }))
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
      rx.ignoreElements(),
    )

    const resizeProgress$ = sharedMove$.pipe(
      rx.map((moveEvent) => {
        const cursorPosition = getPointFromEvent(moveEvent)
        const cursor = screenToCanvas({ camera, point: cursorPosition })

        return resizeShapesStrategy({
          proportional: moveEvent.shiftKey,
          reflow: moveEvent.ctrlKey,
          cursor,
        })
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
    )

    const shapesCommit$ = rx.merge(pointerUp$, pointerLeave$).pipe(
      rx.withLatestFrom(viewState$),
      rx.filter(([_, state]) => isShapesResize(state)),
      rx.map(() => markDirtySelectedShapes(shapes$.getValue())),
      rx.tap(() => {
        viewState$.next(goToIdle({ selectedIds }))
        resetResizeCursor()
      }))

    return rx.merge(resizeActivation$, resizeProgress$, shapesCommit$)
  })
)
