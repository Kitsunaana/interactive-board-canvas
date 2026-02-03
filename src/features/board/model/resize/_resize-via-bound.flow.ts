import { independentResizeFromBound } from "@/entities/shape/lib/transform/_resize/single/_independent-bound"
import { independentResizeFromCorner } from "@/entities/shape/lib/transform/_resize/single/_independent-corner"
import { proportionalResizeFromBound } from "@/entities/shape/lib/transform/_resize/single/_proportional-bound"
import { proportionalResizeFromCorner } from "@/entities/shape/lib/transform/_resize/single/_proportional-corner"
import { getBoundingBox } from "@/entities/shape/model/get-bounding-box"
import { markDirtySelectedShapes } from "@/entities/shape/model/render-state"
import type { ClientShape } from "@/entities/shape/model/types"
import { getPointFromEvent, screenToCanvasV2 } from "@/shared/lib/point"
import { calculateAABBFromRects, getAABBSize } from "@/shared/lib/rect"
import type { Point, RotatableRect } from "@/shared/type/shared"
import * as rx from "rxjs"
import type { Selection } from "../../domain/selection"
import type { Bound } from "../../domain/selection-area"
import { camera$ } from "../../modules/camera"
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$ } from "../../modules/pick-node"
import { goToIdle, goToShapesResize, isIdle, isShapesResize, shapesToRender$, viewState$, type ShapesResizeViewState } from "../../view-model/state"
import { shapes$ } from "../shapes"
import { createGroupFromBoundResizeState } from "./_get-group-resize-state"
import { independentGroupResizeFromBound } from "./_independent-group-resize-from-bound"
import { proporionalGroupResizeFromBound } from "./_proportional-group-resize-from-bound"
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

const resize = {
  group: {
    bound: {
      independent: independentGroupResizeFromBound,
      proportional: proporionalGroupResizeFromBound,
    }
  },
  single: {
    corner: {
      independent: independentResizeFromCorner,
      proportional: proportionalResizeFromCorner,
    },
    bound: {
      independent: independentResizeFromBound,
      proportional: proportionalResizeFromBound,
    }
  }
}

const getShapesResizeStrategy = (shapes: ClientShape[], handler: Bound, selectedIds: Selection) => {
  const shapesToResize = shapes.filter(shape => shape.client.isSelected)
  const aabb = calculateAABBFromRects(shapesToResize.map((shape) => getBoundingBox(shape.geometry, shape.transform.rotate)))
  const boundingBox = getAABBSize(aabb)

  const mapedShapesToStae = shapesToResize.map((shape) => ({
    ...getBoundingBox(shape.geometry, 0),
    points: shape.geometry.kind === "path-geometry" ? shape.geometry.points : null,
    rotate: shape.transform.rotate,
    id: shape.id,
  }) as RotatableRect<true>)

  return ({
    single: {
      activation: (selectedIds: Selection) => {
        return goToShapesResize({
          selectedIds,
          selection: {
            bounds: [],
            area: {
              rotate: 0,
              height: 0,
              width: 0,
              x: 0,
              y: 0,
            }
          }
        })
      },

      resize: (cursor: Point) => {
        return {
          nextState: (state: ShapesResizeViewState) => {
            return goToShapesResize({ ...state })
          },

          nextShapes: (shiftKey: boolean) => {
            const resizeType: keyof typeof createGroupFromBoundResizeState = shiftKey ? "proportional" : "independent"
            const shape = shapesToResize[0]

            const shapeToResize = {
              ...getBoundingBox(shape.geometry, 0),
              id: shape.id,
              rotate: shape.transform.rotate,
              points: shape.geometry.kind === "path-geometry" ? shape.geometry.points : null,
            }

            const patcher = resize.single.bound[resizeType][handler]({ cursor, shape: shapeToResize })

            return mapSelectedShapes(shapes, (shape) => ({
              ...shape,
              geometry: {
                ...shape.geometry,
                ...patcher,
              }
            })) as ClientShape[]
          },
        }
      },

      finish: () => {
        return {
          nextState: (selectedIds: Selection) => goToIdle({ selectedIds }),

          nextShapes: (shapes: ClientShape[]) => markDirtySelectedShapes(shapes),
        }
      }
    },
    group: {
      activation: (selectedIds: Selection) => {
        applyResizeViaBoundCursor(handler)

        return goToShapesResize({
          selectedIds,
          selection: {
            bounds: mapedShapesToStae,
            area: {
              ...boundingBox,
              rotate: 0,
            },
          }
        })
      },

      resize: (cursor: Point) => {
        return {
          nextState: (state: ShapesResizeViewState) => {
            return goToShapesResize({ ...state })
          },

          nextShapes: (shiftKey: boolean) => {
            const resizeType: keyof typeof createGroupFromBoundResizeState = shiftKey ? "proportional" : "independent"

            const initialResizeState = createGroupFromBoundResizeState[resizeType][handler](mapedShapesToStae, boundingBox)
            const patcher = resize.group.bound[resizeType][handler](initialResizeState, cursor)

            return mapSelectedShapes(shapes, (shape) => ({
              ...shape,
              geometry: {
                ...shape.geometry,
                ...patcher.find((item) => item.id === shape.id),
              }
            }) as ClientShape)
          }
        }
      },

      finish: () => {
        resetResizeCursor()

        return {
          nextState: (selectedIds: Selection) => goToIdle({ selectedIds }),
          nextShapes: (shapes: ClientShape[]) => markDirtySelectedShapes(shapes),
        }
      }
    },
  })[selectedIds.size > 1 ? "group" : "single"]
}

const shapesMarkVectorAsync = (shapes: ClientShape[]) => {
  return new Promise(() => {
    shapes.forEach((shape) => {
      if (shape.client.isSelected) {
        shape.client.renderMode.kind = "vector"
      }
    })
  })
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
    const sharedMove$ = pointerMove$.pipe(rx.share())

    const resizeStrategy = getShapesResizeStrategy(shapes, handler, selectedIds)
    shapesMarkVectorAsync(shapes)
    viewState$.next(resizeStrategy.activation(selectedIds))

    const resizeProgress$ = sharedMove$.pipe(
      rx.withLatestFrom(viewState$.pipe(rx.filter(isShapesResize))),
      rx.map(([moveEvent, state]) => {
        const cursor = screenToCanvasV2(getPointFromEvent(moveEvent), camera)
        const resized = resizeStrategy.resize(cursor)

        viewState$.next(resized.nextState(state))

        return resized.nextShapes(moveEvent.shiftKey)
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
    )

    const resizeCommit$ = rx.merge(pointerLeave$, pointerUp$).pipe(
      rx.withLatestFrom(viewState$),
      rx.filter(([_, state]) => isShapesResize(state)),
      rx.map(() => {
        const finished = resizeStrategy.finish()
        viewState$.next(finished.nextState(selectedIds))

        return finished.nextShapes(shapes$.getValue())
      })
    )

    return rx.merge(resizeProgress$, resizeCommit$)
  })
)