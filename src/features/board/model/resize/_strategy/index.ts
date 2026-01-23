import { _u } from "@/shared/lib/utils"
import type { Point, Rect } from "@/shared/type/shared"
import type { NodeBound, NodeCorner } from "../../../domain/selection-area"
import type { ShapeToRender } from "../../../domain/shape"
import { MultipleShapesTransform } from "./_multiple"
import { SingleShapeResize } from "./_single"

export type ResizeInteraction = {
  proportional: boolean
  reflow: boolean
  cursor: Point
}

export type ResizeStrategyContext<Handler> = {
  selectionArea: Rect
  shapes: ShapeToRender[]
  handler: Handler
}

export type ShapeResizeStrategy = (params: ResizeInteraction) => ShapeToRender[]

export const getShapesResizeViaBoundStrategy = ({ shapes, handler, ...props }: ResizeStrategyContext<NodeBound>) => {
  const selectedShapes = shapes.filter((shape) => shape.isSelected)

  if (selectedShapes.length > 1) {
    return ({ reflow, proportional, cursor }: ResizeInteraction) => {
      const toResize = _u.merge(props, {
        allShapes: shapes,
        selectedShapes,
        cursor,
      })

      if (proportional && reflow) return MultipleShapesTransform.Reflow.ViaBound.Proportional[handler.id](toResize)
      if (proportional) return MultipleShapesTransform.Resize.ViaBound.Proportional[handler.id](toResize)
      if (reflow) return MultipleShapesTransform.Reflow.ViaBound.Independent[handler.id](toResize)

      return MultipleShapesTransform.Resize.ViaBound.Independent[handler.id](toResize)
    }
  }

  return ({ proportional, cursor }: ResizeInteraction) => {
    if (proportional) return SingleShapeResize.ViaBound.Proportional[handler.id]({ cursor, shapes })

    return SingleShapeResize.ViaBound.Independent[handler.id]({ cursor, shapes })
  }
}

export const getShapesResizeViaCornerStrategy = ({ handler, shapes, ...props }: ResizeStrategyContext<NodeCorner>) => {
  const selectedShapes = shapes.filter((shape) => shape.isSelected)

  if (selectedShapes.length > 1) {
    return ({ cursor, reflow, proportional }: ResizeInteraction) => {
      const toResize = _u.merge(props, {
        allShapes: shapes,
        selectedShapes,
        cursor,
      })

      if (proportional && reflow) return MultipleShapesTransform.Reflow.ViaCorner.Proportional[handler.id](toResize)
      if (proportional) return MultipleShapesTransform.Resize.ViaCorner.Proportional[handler.id](toResize)
      if (reflow) return MultipleShapesTransform.Reflow.ViaCorner.Independent[handler.id](toResize)

      return MultipleShapesTransform.Resize.ViaCorner.Independent[handler.id](toResize)
    }
  }

  return ({ cursor, proportional }: ResizeInteraction) => {
    if (proportional) return SingleShapeResize.ViaCorner.Proportional[handler.id]({ cursor, shapes })

    return SingleShapeResize.ViaCorner.Independent[handler.id]({ cursor, shapes })
  }
}