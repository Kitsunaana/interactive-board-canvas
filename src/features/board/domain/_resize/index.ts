import type { Point } from "@/shared/type/shared"
import type { SelectionBounds } from "../../modules/_pick-node/_core"
import type { Bound, Selection } from "../_selection/_selection.type"
import type { ShapeToView } from "../_shape"
import { multiple } from "./_multiple"
import { type ResizeMultipleFromEdgeParams } from "./_shared"
import { single } from "./_single"

type ResizeInteraction = {
  canvasPoint: Point

  proportional: boolean
  reflow: boolean
}

export const getShapesResizeStrategy = ({ node, selectedIds, selectionBounds, shapes }: {
  selectionBounds: SelectionBounds
  selectedIds: Selection
  shapes: ShapeToView[]
  node: Bound
}) => {
  if (selectedIds.size > 1) {
    return ({ reflow, proportional, canvasPoint }: ResizeInteraction) => {
      const params: ResizeMultipleFromEdgeParams = {
        selectionArea: selectionBounds.area,
        cursor: canvasPoint,
        shapes,
      }

      if (proportional && reflow) return multiple.reflow.proportional[node.id](params)
      if (proportional) return multiple.resize.proportional[node.id](params)
      if (reflow) return multiple.reflow.independent[node.id](params)

      return multiple.resize.independent[node.id](params)
    }
  }

  return ({ proportional, canvasPoint }: ResizeInteraction) => {
    if (proportional) return single.resize.proportional[node.id]({ cursor: canvasPoint, shapes })

    return single.resize.independent[node.id]({ cursor: canvasPoint, shapes })
  }
}