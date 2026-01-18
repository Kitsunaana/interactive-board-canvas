import { _u } from "@/shared/lib/utils"
import type { Rect } from "@/shared/type/shared"
import type { Selection } from "../selection"
import type { NodeBound, NodeCorner } from "../selection-area"
import type { ShapeToView } from "../shape"
import { SingleViaCorner } from "./_handler-single"
import { multiple } from "./_multiple"
import type { ResizeInteraction, ResizeMultipleFromEdgeParams } from "./_shared"
import { single } from "./_single"

export const getShapesResizeStrategyViaBound = ({ selectedIds, edge, ...props }: {
  selectionArea: Rect
  selectedIds: Selection
  shapes: ShapeToView[]
  edge: NodeBound
}) => {
  if (selectedIds.size > 1) {
    return ({ reflow, proportional, cursor }: ResizeInteraction) => {
      const toResize: ResizeMultipleFromEdgeParams = _u.merge(props, { cursor })

      if (proportional && reflow) return multiple.reflow.proportional[edge.id](toResize)
      if (proportional) return multiple.resize.proportional[edge.id](toResize)
      if (reflow) return multiple.reflow.independent[edge.id](toResize)

      return multiple.resize.independent[edge.id](toResize)
    }
  }

  return ({ proportional, cursor }: ResizeInteraction) => {
    const { shapes } = props

    if (proportional) return single.resize.proportional[edge.id]({ cursor, shapes })

    return single.resize.independent[edge.id]({ cursor, shapes })
  }
}

export const getShapesResizeStrategyViaCorner = ({ corner, shapes, selectedIds }: {
  selectedIds: Selection
  shapes: ShapeToView[]
  selectionArea: Rect
  corner: NodeCorner
}) => {
  if (selectedIds.size > 1) {

  }

  return ({ cursor }: ResizeInteraction) =>SingleViaCorner.resize.independent[corner.id]({ cursor, shapes })
}