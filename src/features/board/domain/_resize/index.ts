import { _u } from "@/shared/lib/utils"
import type { Point, Rect } from "@/shared/type/shared"
import type { Edge, Selection } from "../_selection/_selection.type"
import type { ShapeToView } from "../_shape"
import { multiple } from "./_multiple"
import { type ResizeMultipleFromEdgeParams } from "./_shared"
import { single } from "./_single"

type ResizeInteraction = {
  proportional: boolean
  reflow: boolean
  cursor: Point
}

export const getShapesResizeStrategy = ({ selectedIds, edge, ...props }: {
  selectionArea: Rect
  selectedIds: Selection
  shapes: ShapeToView[]
  edge: Edge
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