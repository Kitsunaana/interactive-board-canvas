import { independentGroupReflowFromBound } from "@/entities/shape/lib/transform/_reflow/_independent-multiple"
import { independentGroupResizeFromCorner } from "@/entities/shape/lib/transform/_resize/group/_independent-group-resize-corner"
import { proportionalGroupResizeFromCorner } from "@/entities/shape/lib/transform/_resize/group/_proportional-group-resize-corner"
import { independentResizeFromBound } from "@/entities/shape/lib/transform/_resize/single/_independent-bound"
import { independentResizeFromCorner } from "@/entities/shape/lib/transform/_resize/single/_independent-corner"
import { proportionalResizeFromBound } from "@/entities/shape/lib/transform/_resize/single/_proportional-bound"
import { proportionalResizeFromCorner } from "@/entities/shape/lib/transform/_resize/single/_proportional-corner"
import { getBoundingBox } from "@/entities/shape/model/get-bounding-box"
import { markDirtySelectedShapes } from "@/entities/shape/model/render-state"
import type { ClientShape } from "@/entities/shape/model/types"
import { getPointFromEvent, screenToCanvasV2 } from "@/shared/lib/point"
import { calculateAABBFromRects, getAABBSize } from "@/shared/lib/rect"
import type { Point, Rect, RotatableRect } from "@/shared/type/shared"
import * as rx from "rxjs"
import { independentGroupResizeFromBound } from "../../../../entities/shape/lib/transform/_resize/group/_independent-group-resize-bound"
import { proporionalGroupResizeFromBound } from "../../../../entities/shape/lib/transform/_resize/group/_proportional-group-resize-bound"
import type { Selection } from "../../domain/selection"
import type { Bound, Corner } from "../../domain/selection-area"
import { camera$ } from "../../modules/camera"
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$ } from "../../modules/pick-node"
import type { HitResizeHandler } from "../../modules/pick-node/_core"
import { goToIdle, goToShapesResize, isIdle, isShapesResize, shapesToRender$, viewState$, type ShapesResizeViewState } from "../../view-model/state"
import { shapes$ } from "../shapes"
import { createGroupReflowState, createGroupResizeState } from "./_get-group-resize-state"
import { mapSelectedShapes } from "./_strategy/_lib"
import { SELECTION_BOUNDS_PADDING } from "@/entities/shape"
import { proportionalGroupReflowFromBound } from "@/entities/shape/lib/transform/_reflow/_proportional-multiple"

const applyResizeCursor = (bound: Bound | Corner) => {
  document.documentElement.style.cursor = ({
    bottomRight: "",
    bottomLeft: "",
    topRight: "",
    topLeft: "",
    bottom: "ns-resize",
    right: "ew-resize",
    left: "ew-resize",
    top: "ns-resize",
  }[bound])
}

const resetResizeCursor = () => {
  document.documentElement.style.cursor = "default"
}

const transform = {
  group: {
    bottomRight: {
      resize: {
        independent: independentGroupResizeFromCorner.bottomRight,
        proportional: proportionalGroupResizeFromCorner.bottomRight,
      },
    },
    bottomLeft: {
      resize: {
        independent: independentGroupResizeFromCorner.bottomLeft,
        proportional: proportionalGroupResizeFromCorner.bottomLeft,
      },
    },
    topRight: {
      resize: {
        independent: independentGroupResizeFromCorner.topRight,
        proportional: proportionalGroupResizeFromCorner.topRight,
      },
    },
    topLeft: {
      resize: {
        independent: independentGroupResizeFromCorner.topLeft,
        proportional: proportionalGroupResizeFromCorner.topLeft,
      },
    },

    bottom: {
      resize: {
        independent: independentGroupResizeFromBound.bottom,
        proportional: proporionalGroupResizeFromBound.bottom,
      },
      reflow: {
        independent: independentGroupReflowFromBound.bottom,
      },
    },
    right: {
      resize: {
        independent: independentGroupResizeFromBound.right,
        proportional: proporionalGroupResizeFromBound.right,
      },
      reflow: {
        independent: independentGroupReflowFromBound.right,
      },
    },
    left: {
      resize: {
        independent: independentGroupResizeFromBound.left,
        proportional: proporionalGroupResizeFromBound.left,
      },
      reflow: {
        independent: independentGroupReflowFromBound.left,
      },
    },
    top: {
      resize: {
        independent: independentGroupResizeFromBound.top,
        proportional: proporionalGroupResizeFromBound.top,
      },
      reflow: {
        independent: independentGroupReflowFromBound.top,
      },
    },
  },

  single: {
    bottomRight: {
      independent: independentResizeFromCorner.bottomRight,
      proportional: proportionalResizeFromCorner.bottomRight,
    },
    bottomLeft: {
      independent: independentResizeFromCorner.bottomLeft,
      proportional: proportionalResizeFromCorner.bottomLeft,
    },
    topRight: {
      independent: independentResizeFromCorner.topRight,
      proportional: proportionalResizeFromCorner.topRight,
    },
    topLeft: {
      independent: independentResizeFromCorner.topLeft,
      proportional: proportionalResizeFromCorner.topLeft,
    },

    bottom: {
      independent: independentResizeFromBound.bottom,
      proportional: proportionalResizeFromBound.bottom,
    },
    right: {
      independent: independentResizeFromBound.right,
      proportional: proportionalResizeFromBound.right,
    },
    left: {
      independent: independentResizeFromBound.left,
      proportional: proportionalResizeFromBound.left,
    },
    top: {
      independent: independentResizeFromBound.top,
      proportional: proportionalResizeFromBound.top,
    },
  }
}

const computeAreaWhenIndependentReflowFromBound = (cursor: Point, boundingBox: Rect) => ({
  bottomRight: () => ({}),
  bottomLeft: () => ({}),
  topRight: () => ({}),
  topLeft: () => ({}),

  bottom: () => {
    const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING
    const bottom = boundingBox.y + boundingBox.height
    const delta = correctedCursorY - bottom

    return {
      height: boundingBox.height + delta,
    }
  },
  right: () => {
    const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
    const right = boundingBox.x + boundingBox.width
    const delta = correctedCursorX - right

    return {
      width: boundingBox.width + delta,
    }
  },
  left: () => {
    const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
    const delta = boundingBox.x - correctedCursorX

    return {
      x: boundingBox.x - delta,
      width: boundingBox.width + delta
    }
  },
  top: () => {
    const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING
    const delta = boundingBox.y - correctedCursorY

    return {
      y: boundingBox.y - delta,
      height: boundingBox.height + delta
    }
  },
})

const getShapesResizeStrategy = (shapes: ClientShape[], hitTarget: HitResizeHandler, selectedIds: Selection) => {
  const shapesToResize = shapes.filter(shape => shape.client.isSelected)
  const aabb = calculateAABBFromRects(shapesToResize.map((shape) => getBoundingBox(shape.geometry, shape.transform.rotate)))
  const boundingBox = getAABBSize(aabb)

  const mapedShapesToState = shapesToResize.map((shape) => ({
    ...getBoundingBox(shape.geometry, 0),
    points: shape.geometry.kind === "path-geometry" ? shape.geometry.points : null,
    rotate: shape.transform.rotate,
    id: shape.id,
  }) as RotatableRect<true>)

  const mode = selectedIds.size > 1 ? "group" : "single"

  return ({
    single: () => {
      const resizeHandler = transform.single[hitTarget.handler]

      return {
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

        resize: (cursor: Point, shiftKey: boolean) => {
          return {
            nextState: (state: ShapesResizeViewState) => {
              return goToShapesResize({ ...state })
            },

            nextShapes: () => {
              const resizeType = shiftKey ? "proportional" : "independent"
              const shape = shapesToResize[0]

              const shapeToResize = {
                ...getBoundingBox(shape.geometry, 0),
                id: shape.id,
                rotate: shape.transform.rotate,
                points: shape.geometry.kind === "path-geometry" ? shape.geometry.points : null,
              }

              const patcher = resizeHandler[resizeType]({ cursor, shape: shapeToResize })

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
      }
    },
    group: () => {
      const resizeHandler = transform.group[hitTarget.handler]

      // RIGHT

      return {
        activation: (selectedIds: Selection) => {
          applyResizeCursor(hitTarget.handler)

          return goToShapesResize({
            selectedIds,
            selection: {
              bounds: mapedShapesToState,
              area: {
                ...boundingBox,
                rotate: 0,
              },
            }
          })
        },

        resize: (cursor: Point, shiftKey: boolean) => {
          const resizeType = shiftKey ? "proportional" : "independent"

          const initialResizeState = createGroupResizeState[hitTarget.handler][resizeType](mapedShapesToState, boundingBox)
          // const patcher = resizeHandler[resizeType](initialResizeState, cursor)

          const state = createGroupReflowState[hitTarget.handler]["proportional"](mapedShapesToState, boundingBox)
          const pathcer = proportionalGroupReflowFromBound[hitTarget.handler](state, cursor)

          const nextShapes = mapSelectedShapes(shapes, (shape) => ({
            ...shape,
            geometry: {
              ...shape.geometry,
              ...pathcer[shape.id]
            }
          })) as ClientShape[]

          return {
            nextState: (state: ShapesResizeViewState) => {
              const selectionAreaPatch = computeAreaWhenIndependentReflowFromBound(cursor, boundingBox)[hitTarget.handler]

              return goToShapesResize({
                ...state,
                selection: {
                  area: {
                    ...state.selection.area,
                    ...selectionAreaPatch()
                  },
                  bounds: nextShapes.filter((shape) => shape.client.isSelected).map((shape) => ({
                    ...getBoundingBox(shape.geometry, 0),
                    rotate: shape.transform.rotate,
                    id: shape.id,
                  }))
                }
              })
            },

            nextShapes: () => nextShapes
          }
        },

        finish: () => {
          resetResizeCursor()

          return {
            nextState: (selectedIds: Selection) => goToIdle({ selectedIds }),
            nextShapes: (shapes: ClientShape[]) => markDirtySelectedShapes(shapes),
          }
        }
      }
    },
  })[mode]()
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
  rx.filter((node) => node.type === "resize-handler"),
  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle), rx.map((state) => state.selectedIds)),
    shapesToRender$,
    camera$
  ),
  rx.map(([handler, selectedIds, shapes, camera]) => ({ selectedIds, camera, shapes, handler })),
  rx.switchMap(({ camera, handler, shapes, selectedIds }) => {
    const sharedMove$ = pointerMove$.pipe(rx.share())
    console.log(handler)

    const resizeStrategy = getShapesResizeStrategy(shapes, handler, selectedIds)
    shapesMarkVectorAsync(shapes)
    viewState$.next(resizeStrategy.activation(selectedIds))

    const resizeProgress$ = sharedMove$.pipe(
      rx.withLatestFrom(viewState$.pipe(rx.filter(isShapesResize))),
      rx.map(([moveEvent, state]) => {
        const cursor = screenToCanvasV2(getPointFromEvent(moveEvent), camera)
        const resized = resizeStrategy.resize(cursor, moveEvent.shiftKey)

        viewState$.next(resized.nextState(state))

        return resized.nextShapes()
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