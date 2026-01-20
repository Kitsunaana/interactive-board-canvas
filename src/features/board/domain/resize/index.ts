import { _u } from "@/shared/lib/utils"
import type { Rect } from "@/shared/type/shared"
import { SingleShapeResize } from "../../model/shape-resize/_single"
import type { Selection } from "../selection"
import type { NodeBound, NodeCorner } from "../selection-area"
import type { ShapeToView } from "../shape"
import type { ResizeInteraction, ResizeMultipleFromBoundParams } from "./_shared"
import { MultipleShapesTransform } from "../../model/shape-resize/_multiple"

export const getShapesResizeViaBoundStrategy = ({ selectedIds, shapes, bound, ...props }: {
  selectionArea: Rect
  selectedIds: Selection
  shapes: ShapeToView[]
  bound: NodeBound
}) => {
  if (selectedIds.size > 1) {
    return ({ reflow, proportional, cursor }: ResizeInteraction) => {
      const toResize: ResizeMultipleFromBoundParams = _u.merge(props, { cursor, shapes })

      if (proportional && reflow) return MultipleShapesTransform.Reflow.ViaBound.Proportional[bound.id](toResize)
      if (proportional) return MultipleShapesTransform.Resize.ViaBound.Proportional[bound.id](toResize)
      if (reflow) return MultipleShapesTransform.Reflow.ViaBound.Independent[bound.id](toResize)

      return MultipleShapesTransform.Resize.ViaBound.Independent[bound.id](toResize)
    }
  }

  return ({ proportional, cursor }: ResizeInteraction) => {
    if (proportional) return SingleShapeResize.ViaBound.Proportional[bound.id]({ cursor, shapes })

    return SingleShapeResize.ViaBound.Independent[bound.id]({ cursor, shapes })
  }
}

export const getShapesResizeViaCornerStrategy = ({ corner, shapes, selectedIds, ...props }: {
  selectedIds: Selection
  shapes: ShapeToView[]
  selectionArea: Rect
  corner: NodeCorner
}) => {
  if (selectedIds.size > 1) {
    return ({ cursor, reflow, proportional }: ResizeInteraction) => {
      const toResize: ResizeMultipleFromBoundParams = _u.merge(props, { cursor, shapes })

      if (proportional && reflow) return MultipleShapesTransform.Reflow.ViaCorner.Proportional[corner.id](toResize)
      if (proportional) return MultipleShapesTransform.Resize.ViaCorner.Proportional[corner.id](toResize)
      if (reflow) return MultipleShapesTransform.Reflow.ViaCorner.Independent[corner.id](toResize)

      return MultipleShapesTransform.Resize.ViaCorner.Independent[corner.id](toResize)
    }
  }

  return ({ cursor, proportional }: ResizeInteraction) => {
    if (proportional) return SingleShapeResize.ViaCorner.Proportional[corner.id]({ cursor, shapes })

    return SingleShapeResize.ViaCorner.Independent[corner.id]({ cursor, shapes })
  }
}