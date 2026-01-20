import { _u } from "@/shared/lib/utils"
import type { Point, Rect } from "@/shared/type/shared"
import type { NodeBound, NodeCorner } from "../../domain/selection-area"
import type { ShapeToView } from "../../domain/shape"
import { MultipleShapesTransform } from "./_multiple"
import { SingleShapeResize } from "./_single"

type ResizeInteraction = {
  proportional: boolean
  reflow: boolean
  cursor: Point
}

export const getShapesResizeViaBoundStrategy = ({ shapes, bound, ...props }: {
  selectionArea: Rect
  shapes: ShapeToView[]
  bound: NodeBound
}) => {
  const selectedShapes = shapes.filter((shape) => shape.isSelected)

  if (selectedShapes.length > 1) {
    return ({ reflow, proportional, cursor }: ResizeInteraction) => {
      const toResize = _u.merge(props, {
        allShapes: shapes,
        selectedShapes,
        cursor,
      })

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

export const getShapesResizeViaCornerStrategy = ({ corner, shapes, ...props }: {
  shapes: ShapeToView[]
  selectionArea: Rect
  corner: NodeCorner
}) => {
  const selectedShapes = shapes.filter((shape) => shape.isSelected)

  if (selectedShapes.length > 1) {
    return ({ cursor, reflow, proportional }: ResizeInteraction) => {
      const toResize = _u.merge(props, {
        allShapes: shapes,
        selectedShapes,
        cursor,
      })

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