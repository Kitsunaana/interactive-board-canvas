import { match } from "@/shared/lib/match"
import type { Point } from "@/shared/type/shared"
import type { IdleViewState } from "../../view-model/state/_view-model.type"
import type { Bound } from "../_selection/_selection.type"
import type { Shape } from "../_shape"
import { independentResizeHandlers } from "./_independent"
import { proportionalResizeHandlers } from "./_proportional"

type AppliedEdgeResize = (params: { canvasPoint: Point, shape: Shape, node: Bound }) => Shape

const proportionalAppliedEdgeResize: AppliedEdgeResize = ({ canvasPoint, shape, node }) => (
  match(node, {
    bottom: () => proportionalResizeHandlers.applyBottomEdgeResize({ canvasPoint, shape }),
    right: () => proportionalResizeHandlers.applyRightEdgeResize({ canvasPoint, shape }),
    left: () => proportionalResizeHandlers.applyLeftEdgeResize({ canvasPoint, shape }),
    top: () => proportionalResizeHandlers.applyTopEdgeResize({ canvasPoint, shape }),
  }, "id")
)

const independentAppliedEdgeResize: AppliedEdgeResize = ({ canvasPoint, shape, node }) => (
  match(node, {
    bottom: () => independentResizeHandlers.applyBottomEdgeResize({ canvasPoint, shape }),
    right: () => independentResizeHandlers.applyRightEdgeResize({ canvasPoint, shape }),
    left: () => independentResizeHandlers.applyLeftEdgeResize({ canvasPoint, shape }),
    top: () => independentResizeHandlers.applyTopEdgeResize({ canvasPoint, shape })
  }, "id")
)

export const getShapesResizeStrategy = ({ idleState, shapes, node }: {
  idleState: IdleViewState
  shapes: Shape[]
  node: Bound
}) => {
  return ({ canvasPoint, proportional }: {
    proportional: boolean
    canvasPoint: Point
  }) => {
    if (idleState.selectedIds.size > 1) {
      return shapes
    }

    return shapes.map((shape) => {
      if (idleState.selectedIds.has(shape.id)) {
        const params = { canvasPoint, shape, node }

        if (proportional) return proportionalAppliedEdgeResize(params)

        return match(shape, {
          rectangle: () => independentAppliedEdgeResize(params),
          circle: () => proportionalAppliedEdgeResize(params),
          square: () => independentAppliedEdgeResize(params),
          arrow: () => shape,
        })
      }

      return shape
    })
  }
}