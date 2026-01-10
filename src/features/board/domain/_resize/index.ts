import type { Point } from "@/shared/type/shared"
import { independentResizeHandlers } from "./_independent"
import { proportionalResizeHandlers } from "./_proportional"
import type { Shape } from "../_shape"
import type { Bound } from "../_selection/_selection.type"
import { match } from "@/shared/lib/match"
import type { IdleViewState } from "../../view-model/state/_view-model.type"
import { left, matchEither, right } from "@/shared/lib/either"

type ComputeAppliedEdgeResize = (params: { canvasPoint: Point, shape: Shape, node: Bound }) => Shape

const computeProportionalAppliedEdgeResize: ComputeAppliedEdgeResize = ({ canvasPoint, shape, node }) => (
  match(node, {
    bottom: () => proportionalResizeHandlers.applyBottomEdgeResize({ canvasPoint, shape }),
    right: () => proportionalResizeHandlers.applyRightEdgeResize({ canvasPoint, shape }),
    left: () => proportionalResizeHandlers.applyLeftEdgeResize({ canvasPoint, shape }),
    top: () => proportionalResizeHandlers.applyTopEdgeResize({ canvasPoint, shape }),
  }, "id")
)

const computeIndependentAppliedEdgeResize: ComputeAppliedEdgeResize = ({ canvasPoint, shape, node }) => (
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
  return matchEither(idleState.selectedIds.size > 1 ? right(null) : left(null), {
    right: () => {
      return ({ canvasPoint: _ }: { canvasPoint: Point }) => shapes
    },

    left: () => ({ canvasPoint }: { canvasPoint: Point }) => (
      shapes.map((shape) => {
        if (idleState.selectedIds.has(shape.id)) {
          return match(shape, {
            rectangle: () => computeIndependentAppliedEdgeResize({ canvasPoint, shape, node }),
            circle: () => computeProportionalAppliedEdgeResize({ canvasPoint, shape, node }),
            square: () => computeIndependentAppliedEdgeResize({ canvasPoint, shape, node }),
            arrow: () => shape,
          })
        }

        return shape
      })
    )
  })
}