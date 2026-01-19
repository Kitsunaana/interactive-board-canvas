import { _u } from "@/shared/lib/utils"
import type { Rect } from "@/shared/type/shared"
import type { Selection } from "../selection"
import type { NodeBound, NodeCorner } from "../selection-area"
import type { ShapeToView } from "../shape"
import { SingleViaCorner } from "./_single-via-handler"
import { multiple } from "./_multiple-via-bound"
import type { ResizeInteraction, ResizeMultipleFromBoundParams } from "./_shared"
import { single } from "./_single-via-bound"
import { MultipleViaHandler } from "./_multiple-via-handler"

export const getShapesResizeViaBoundStrategy = ({ selectedIds, shapes, bound, ...props }: {
  selectionArea: Rect
  selectedIds: Selection
  shapes: ShapeToView[]
  bound: NodeBound
}) => {
  if (selectedIds.size > 1) {
    return ({ reflow, proportional, cursor }: ResizeInteraction) => {
      const toResize: ResizeMultipleFromBoundParams = _u.merge(props, {
        cursor,
        shapes,
      })

      if (proportional && reflow) return multiple.reflow.proportional[bound.id](toResize)
      if (proportional) return multiple.resize.proportional[bound.id](toResize)
      if (reflow) return multiple.reflow.independent[bound.id](toResize)

      return multiple.resize.independent[bound.id](toResize)
    }
  }

  return ({ proportional, cursor }: ResizeInteraction) => {
    if (proportional) return single.resize.proportional[bound.id]({ cursor, shapes })

    return single.resize.independent[bound.id]({ cursor, shapes })
  }
}

export const getShapesResizeViaCornerStrategy = ({ corner, shapes, selectedIds, selectionArea }: {
  selectedIds: Selection
  shapes: ShapeToView[]
  selectionArea: Rect
  corner: NodeCorner
}) => {
  if (selectedIds.size > 1) {
    return ({ cursor, reflow, proportional }: ResizeInteraction) => {
      if (reflow) {
        return MultipleViaHandler.reflow.independent[corner.id]({ selectionArea, cursor, shapes })
      }

      if (proportional) {
        return MultipleViaHandler.resize.proportional[corner.id]({ selectionArea, cursor, shapes })
      }

      return MultipleViaHandler.resize.independent[corner.id]({ selectionArea, cursor, shapes })
    }
  }

  return ({ cursor, proportional }: ResizeInteraction) => {
    if (proportional) return SingleViaCorner.resize.proportional[corner.id]({ cursor, shapes })

    return SingleViaCorner.resize.independent[corner.id]({ cursor, shapes })
  }
}