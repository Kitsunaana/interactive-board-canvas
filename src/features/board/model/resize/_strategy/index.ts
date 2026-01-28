import { _u } from "@/shared/lib/utils"
import type { Point, Rect } from "@/shared/type/shared"
import type { Bound, Corner } from "../../../domain/selection-area"
import { MultipleShapesTransform } from "./_multiple"
import { SingleShapeResize } from "./_single"
import type { ClientShape } from "@/entities/shape/model/types"

export type ResizeInteraction = {
  proportional: boolean
  reflow: boolean
  cursor: Point
}

export type ResizeStrategyContext<Handler> = {
  shapes: ClientShape[]
  selectionArea: Rect
  handler: Handler
}

export type ShapeResizeStrategy = (params: ResizeInteraction) => ClientShape[]

export const getShapesResizeViaBoundStrategy = ({ shapes, handler, ...props }: ResizeStrategyContext<Bound>) => {
  const selectedShapes = shapes.filter((shape) => shape.client.isSelected)

  if (selectedShapes.length > 1) {
    return ({ reflow, proportional, cursor }: ResizeInteraction) => {
      const toResize = _u.merge(props, {
        allShapes: shapes,
        selectedShapes,
        cursor,
      })

      if (proportional && reflow) return MultipleShapesTransform.Reflow.ViaBound.Proportional[handler](toResize)
      if (proportional) return MultipleShapesTransform.Resize.ViaBound.Proportional[handler](toResize)
      if (reflow) return MultipleShapesTransform.Reflow.ViaBound.Independent[handler](toResize)

      return MultipleShapesTransform.Resize.ViaBound.Independent[handler](toResize)
    }
  }

  return ({ proportional, cursor }: ResizeInteraction) => {
    if (proportional) return SingleShapeResize.ViaBound.Proportional[handler]({ cursor, shapes })

    return SingleShapeResize.ViaBound.Independent[handler]({ cursor, shapes })
  }
}

export const getShapesResizeViaCornerStrategy = ({ handler, shapes, ...props }: ResizeStrategyContext<Corner>) => {
  const selectedShapes = shapes.filter((shape) => shape.client.isSelected)

  if (selectedShapes.length > 1) {
    return ({ cursor, reflow, proportional }: ResizeInteraction) => {
      const toResize = _u.merge(props, {
        allShapes: shapes,
        selectedShapes,
        cursor,
      })

      if (proportional && reflow) return MultipleShapesTransform.Reflow.ViaCorner.Proportional[handler](toResize)
      if (proportional) return MultipleShapesTransform.Resize.ViaCorner.Proportional[handler](toResize)
      if (reflow) return MultipleShapesTransform.Reflow.ViaCorner.Independent[handler](toResize)

      return MultipleShapesTransform.Resize.ViaCorner.Independent[handler](toResize)
    }
  }

  return ({ cursor, proportional }: ResizeInteraction) => {
    if (proportional) return SingleShapeResize.ViaCorner.Proportional[handler]({ cursor, shapes })

    return SingleShapeResize.ViaCorner.Independent[handler]({ cursor, shapes })
  }
}