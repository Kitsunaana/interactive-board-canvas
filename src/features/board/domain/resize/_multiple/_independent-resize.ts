import type { ResizeMultipleFromEdgeParams } from "../_shared"
import { mapSelectedShapes, SELECTION_BOUNDS_PADDING } from "../_shared"

export const resizeFromLeftEdge = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const left = selectionArea.x
  const right = left + selectionArea.width

  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const delta = left - cursorX

  const prevWidth = selectionArea.width
  const nextWidth = prevWidth + delta
  const scale = nextWidth / prevWidth

  if (nextWidth <= 0) {
    const delta = cursorX - right
    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2
    const scale = nextWidth / prevWidth

    if (nextWidth <= 0) {
      return mapSelectedShapes(shapes, (shape) => ({
        ...shape,
        width: 0,
        x: right,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => ({
      ...shape,
      width: shape.width * scale,
      x: right + (shape.x - left) * scale,
    }))
  }

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    width: shape.width * scale,
    x: right + (shape.x - right) * scale,
  }))
}

export const resizeFromRightEdge = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const left = selectionArea.x
  const right = left + selectionArea.width

  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const delta = cursorX - right

  const prevWidth = selectionArea.width
  const nextWidth = prevWidth + delta
  const scale = nextWidth / prevWidth

  if (nextWidth <= 0) {
    const delta = left - cursorX
    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2
    const scale = nextWidth / prevWidth

    if (nextWidth <= 0) {
      return mapSelectedShapes(shapes, (shape) => ({
        ...shape,
        width: 0,
        x: left,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => ({
      ...shape,
      width: shape.width * scale,
      x: left + (shape.x - right) * scale,
    }))
  }

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    width: shape.width * scale,
    x: left + (shape.x - left) * scale,
  }))
}

export const resizeFromTopEdge = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const top = selectionArea.y
  const bottom = top + selectionArea.height

  const cursorPositionY = cursor.y + SELECTION_BOUNDS_PADDING
  const delta = top - cursorPositionY

  const prevHeight = selectionArea.height
  const nextHeight = prevHeight + delta
  const scale = nextHeight / prevHeight

  if (nextHeight <= 0) {
    const delta = cursorPositionY - bottom
    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2
    const scale = nextHeight / prevHeight

    if (nextHeight <= 0) {
      return mapSelectedShapes(shapes, (shape) => ({
        ...shape,
        height: 0,
        y: bottom,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => ({
      ...shape,
      height: shape.height * scale,
      y: bottom + (shape.y - top) * scale,
    }))
  }

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    height: shape.height * scale,
    y: bottom + (shape.y - bottom) * scale,
  }))
}

export const resizeFromBottomEdge = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const top = selectionArea.y
  const bottom = top + selectionArea.height

  const cursorPositionY = cursor.y - SELECTION_BOUNDS_PADDING
  const delta = cursorPositionY - bottom

  const prevHeight = selectionArea.height
  const nextHeight = prevHeight + delta

  const scale = nextHeight / prevHeight

  if (nextHeight <= 0) {
    const delta = top - cursorPositionY
    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2

    const scale = nextHeight / prevHeight

    if (nextHeight <= 0) {
      return mapSelectedShapes(shapes, (shape) => ({
        ...shape,
        y: top,
        height: 0,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => ({
      ...shape,
      height: shape.height * scale,
      y: top + (shape.y - bottom) * scale,
    }))
  }

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    height: shape.height * scale,
    y: top + (shape.y - top) * scale,
  }))
}
