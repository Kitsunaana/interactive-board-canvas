import { getBoundingBox } from "@/entities/shape/model/get-bounding-box"
import type { ClientShape } from "@/entities/shape/model/types"
import { calculateLimitPointsFromRects } from "@/shared/lib/rect"
import type { Rect } from "@/shared/type/shared"

export const computeSelectionBoundsArea = (shapes: ClientShape[]) => {
  const selectedShapes = shapes.filter((shape) => shape.client.isSelected).map((shape) => {
    return getBoundingBox(shape.geometry, shape.transform.rotate)
  })

  if (selectedShapes.length === 1) {
    return {
      bounds: [] satisfies Rect[],
      area: selectedShapes[0],
    }
  }

  if (selectedShapes.length > 1) {
    const limitPoints = calculateLimitPointsFromRects({ rects: selectedShapes })

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