import type { ResizeMultipleFromBoundParams } from "../_shared"
import { mapSelectedShapes, SELECTION_BOUNDS_PADDING } from "../_shared"

export const reflowFromLeftBound = ({ selectionArea, shapes, cursor }: ResizeMultipleFromBoundParams) => {
  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const left = selectionArea.x
  const right = left + selectionArea.width
  const delta = cursorX - left

  return mapSelectedShapes(shapes, (shape) => {
    const shapeLeft = shape.x
    const shapeCenter = shapeLeft + shape.width / 2

    const t = (right - shapeCenter) / selectionArea.width
    const easedT = Math.max(0, Math.min(1, t))

    return {
      ...shape,
      x: shapeLeft + easedT * delta,
    }
  })
}

export const reflowFromRightBound = ({ selectionArea, shapes, cursor }: ResizeMultipleFromBoundParams) => {
  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING

  const left = selectionArea.x
  const right = left + selectionArea.width
  const delta = cursorX - right

  return mapSelectedShapes(shapes, (shape) => {
    const shapeLeft = shape.x
    const shapeCenter = shapeLeft + shape.width / 2

    const t = (shapeCenter - left) / selectionArea.width
    const easedT = Math.max(0, Math.min(1, t))

    return {
      ...shape,
      x: shapeLeft + easedT * delta,
    }
  })
}

export const reflowFromTopBound = ({ shapes, cursor, selectionArea }: ResizeMultipleFromBoundParams) => {
  const cursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const delta = cursorY - top

  return mapSelectedShapes(shapes, (shape) => {
    const shapeTop = shape.y
    const shapeCenter = shapeTop + shape.height / 2

    const t = (bottom - shapeCenter) / selectionArea.height
    const easedT = Math.max(0, Math.min(1, t))

    return {
      ...shape,
      y: shapeTop + easedT * delta,
    }
  })
}

export const reflowFromBottomBound = ({ shapes, cursor, selectionArea }: ResizeMultipleFromBoundParams) => {
  const cursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const delta = cursorY - bottom

  return mapSelectedShapes(shapes, (shape) => {
    const shapeTop = shape.y
    const shapeCenter = shapeTop + shape.height / 2

    const t = (shapeCenter - top) / selectionArea.height
    const easedT = Math.max(0, Math.min(1, t))

    return {
      ...shape,
      y: shapeTop + easedT * delta,
    }
  })
}
