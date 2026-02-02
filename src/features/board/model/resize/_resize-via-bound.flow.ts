import { getBoundingBox } from "@/entities/shape/model/get-bounding-box"
import { markDirtySelectedShapes } from "@/entities/shape/model/render-state"
import type { ClientShape } from "@/entities/shape/model/types"
import { getPointFromEvent, screenToCanvasV2 } from "@/shared/lib/point"
import { calculateLimitPointsFromRectsV2, getAABBSize } from "@/shared/lib/rect"
import type { Point, RotatableRect } from "@/shared/type/shared"
import * as rx from "rxjs"
import type { Bound } from "../../domain/selection-area"
import { camera$ } from "../../modules/camera"
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$ } from "../../modules/pick-node"
import { goToIdle, goToShapesResize, isIdle, isShapesResize, shapesToRender$, viewState$ } from "../../view-model/state"
import { shapes$ } from "../shapes"
import { createGroupFromBoundResizeState } from "./_get-group-resize-state"
import { calcGroupBottomBoundProportionalResizePatch, calcGroupLeftBoundProportionalResizePatch, calcGroupTopBoundProportionalResizePatch } from "./_proportional-group-resize-from-bound"
import { mapSelectedShapes } from "./_strategy/_lib"

const applyResizeViaBoundCursor = (bound: Bound) => {
  document.documentElement.style.cursor = ({
    bottom: "ns-resize",
    right: "ew-resize",
    left: "ew-resize",
    top: "ns-resize",
  }[bound])
}

const resetResizeCursor = () => {
  document.documentElement.style.cursor = "default"
}

export const shapesResizeFlowViaBound$ = mouseDown$.pipe(
  rx.map(event => event.node),
  rx.filter((node) => node.type === "bound"),
  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle), rx.map((state) => state.selectedIds)),
    shapesToRender$,
    camera$
  ),
  rx.map(([{ bound }, selectedIds, shapes, camera]) => ({ selectedIds, camera, shapes, handler: bound })),
  rx.switchMap(({ camera, handler, shapes, selectedIds }) => {

    new Promise(() => {
      shapes.forEach((shape) => {
        if (shape.client.isSelected) {
          shape.client.renderMode.kind = "vector"
        }
      })
    })

    const sharedMove$ = pointerMove$.pipe(rx.share())

    const shapesToResize = shapes.filter(shape => shape.client.isSelected)
    const aabb = calculateLimitPointsFromRectsV2(shapesToResize.map((shape) => getBoundingBox(shape.geometry, shape.transform.rotate)))
    const boundingBox = getAABBSize(aabb)

    const resizeActivation$ = sharedMove$.pipe(
      rx.take(1),
      rx.tap(() => {
        applyResizeViaBoundCursor(handler)

        viewState$.next(goToShapesResize({
          selectedIds,
          selection: {
            bounds: [],
            area: {
              ...boundingBox,
              rotate: 0,
            },
          }
        }))
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
      rx.ignoreElements(),
    )

    const resizeState = createGroupFromBoundResizeState[handler](shapesToResize.map((shape) => {
      return {
        ...getBoundingBox(shape.geometry, 0),
        points: shape.geometry.kind === "path-geometry" ? shape.geometry.points : null,
        id: shape.id,
        rotate: shape.transform.rotate,
      } as RotatableRect<true>
    }), boundingBox)

    const resizeProgress$ = sharedMove$.pipe(
      rx.withLatestFrom(viewState$.pipe(rx.filter(isShapesResize))),
      rx.map(([moveEvent, state]) => {
        const cursor = screenToCanvasV2(getPointFromEvent(moveEvent), camera)

        viewState$.next(goToShapesResize({ ...state }))

        // const groupRightBoundResizePatch = groupResizeFromBound[handler](resizeState, cursor)
        const groupRightBoundResizePatch = calcGroupBottomBoundProportionalResizePatch(resizeState, cursor)

        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          geometry: {
            ...shape.geometry,
            ...groupRightBoundResizePatch.find((item) => item.id === shape.id),
          }
        }) as ClientShape)
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