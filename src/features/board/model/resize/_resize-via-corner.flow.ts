import { calcShapeFromCornerIndependentResizePatch } from "@/entities/shape/lib/transform/_resize/_independent-single-from-corner"
import { calcShapeFromCornerAspectResizePatch } from "@/entities/shape/lib/transform/_resize/_proportional-single-from-corner"
import { markDirtySelectedShapes } from "@/entities/shape/model/render-state"
import type { ClientShape, RectangleGeometry } from "@/entities/shape/model/types"
import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point"
import { isNotNull } from "@/shared/lib/utils"
import type { Rect } from "@/shared/type/shared"
import * as rx from "rxjs"
import type { Corner } from "../../domain/selection-area"
import { camera$ } from "../../modules/camera"
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$ } from "../../modules/pick-node"
import { autoSelectionBounds$, pressedResizeHandlerSubject$ } from "../../view-model/selection-bounds"
import { goToIdle, goToShapesResize, isIdle, isShapesResize, shapesToRender$, viewState$ } from "../../view-model/state"
import { shapes$ } from "../shapes"
import { getShapesResizeViaCornerStrategy } from "./_strategy"

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

    getShapesResizeViaCornerStrategy({
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
        viewState$.next(goToShapesResize({ selectedIds, bounds: [], boundingBox: {} as Rect }))
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
      rx.ignoreElements(),
    )

    const resizeProgress$ = sharedMove$.pipe(
      rx.map((moveEvent) => {
        const cursorPosition = getPointFromEvent(moveEvent)
        const cursor = screenToCanvas({ camera, point: cursorPosition })

        const patchRecord = moveEvent.shiftKey
          ? calcShapeFromCornerAspectResizePatch
          : calcShapeFromCornerIndependentResizePatch

        return shapes.map((shape) => {
          if (shape.client.isSelected && shape.geometry.kind === "rectangle-geometry") {
            const patcher = patchRecord[handler.corner]({
              cursor,
              shape: {
                ...shape.geometry as RectangleGeometry,
                id: shape.id,
                rotate: shape.transform.rotate
              }
            })

            return {
              ...shape,
              geometry: {
                ...shape.geometry,
                ...patcher,
              }
            }
          }

          return shape
        }) as ClientShape[]
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
