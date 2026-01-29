import { getBoundingBox } from "@/entities/shape/model/get-bounding-box"
import type { ClientShape } from "@/entities/shape/model/types"
import { calculateLimitPointsFromRects } from "@/shared/lib/rect"
import type { Rect } from "@/shared/type/shared"

export type SelectionBoundsArea = {
  bounds: Array<Rect & { rotate: number }>
  area: Rect & { rotate: number }
}

export const computeSelectionBoundsArea = (shapes: ClientShape[]): SelectionBoundsArea | null => {
  const selectedShapes = shapes.filter((shape) => shape.client.isSelected)

  const boundingBoxesWithoutRotate = selectedShapes.map((shape) => ({
    ...getBoundingBox(shape.geometry, 0),
    rotate: shape.transform.rotate,
  }))

  if (selectedShapes.length === 1) {
    return {
      bounds: boundingBoxesWithoutRotate,
      area: boundingBoxesWithoutRotate[0],
    }
  }

  if (selectedShapes.length > 1) {
    const boundingBoxes = selectedShapes.map((shape) => ({
      ...getBoundingBox(shape.geometry, shape.transform.rotate),
      rotate: shape.transform.rotate,
    }))

    const limitPoints = calculateLimitPointsFromRects({ rects: boundingBoxes })

    return {
      bounds: boundingBoxesWithoutRotate,
      area: {
        height: limitPoints.max.y - limitPoints.min.y,
        width: limitPoints.max.x - limitPoints.min.x,
        x: limitPoints.min.x,
        y: limitPoints.min.y,
        rotate: 0,
      }
    }
  }

  return null
}