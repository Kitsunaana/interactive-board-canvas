import { calculateLimitPoints, inferRect } from "@/shared/lib/rect"
import type { Rect } from "@/shared/type/shared"
import type { ShapeToRender } from "../shape"

export const computeSelectionBoundsArea = (shapes: ShapeToRender[]) => {
  const selectedShapes = shapes.filter(shape => shape.isSelected)

  if (selectedShapes.length === 1) {
    return {
      bounds: [] satisfies Rect[],
      area: inferRect(selectedShapes[0]),
    }
  }

  if (selectedShapes.length > 1) {
    const rectsFromShape = selectedShapes.map(inferRect)
    const limitPoints = calculateLimitPoints({
      rects: rectsFromShape
    })

    return {
      bounds: rectsFromShape,
      area: {
        height: limitPoints.max.y - limitPoints.min.y,
        width: limitPoints.max.x - limitPoints.min.x,
        x: limitPoints.min.x,
        y: limitPoints.min.y,
      }
    }
  }

  return null
}