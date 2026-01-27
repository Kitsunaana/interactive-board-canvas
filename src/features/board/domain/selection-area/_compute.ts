import { getBoundingBox } from "@/entities/shape/model/get-bounding-box"
import { calculateLimitPoints } from "@/shared/lib/rect"
import type { Rect } from "@/shared/type/shared"
import type { ShapeToRender } from "../shape"

export const computeSelectionBoundsArea = (shapes: ShapeToRender[]) => {
  const selectedShapes = shapes.filter((shape) => shape.isSelected).map(getBoundingBox)

  if (selectedShapes.length === 1) {
    return {
      bounds: [] satisfies Rect[],
      area: selectedShapes[0],
    }
  }

  if (selectedShapes.length > 1) {
    const limitPoints = calculateLimitPoints({
      rects: selectedShapes
    })

    return {
      bounds: selectedShapes,
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