import type { ResizeMultipleFromEdgeParams } from "../_shared"
import { SELECTION_BOUNDS_PADDING, mapSelectedShapes } from "../_shared"

export const resizeFromRightEdge = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const left = selectionArea.x
  const right = left + selectionArea.width
  const top = selectionArea.y
  const bottom = selectionArea.y + selectionArea.height

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
        y: top,
        x: left,
        width: 0,
        height: 0,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => {
      const aspectRatio = shape.height / shape.width

      const nextWidth = shape.width * scale
      const nextHeight = nextWidth * aspectRatio

      return {
        ...shape,
        width: nextWidth,
        height: nextHeight,
        y: top + (shape.y - bottom) * scale,
        x: left + (shape.x - right) * scale,
      }
    })
  }

  return mapSelectedShapes(shapes, (shape) => {
    const aspectRatio = shape.height / shape.width

    const nextWidth = shape.width * scale
    const nextHeight = nextWidth * aspectRatio

    return {
      ...shape,
      width: nextWidth,
      height: nextHeight,
      y: top + (shape.y - top) * scale,
      x: left + (shape.x - left) * scale,
    }
  })
}

export const resizeFromLeftEdge = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const left = selectionArea.x
  const right = left + selectionArea.width
  const top = selectionArea.y
  const bottom = top + selectionArea.height

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
        y: top,
        x: right,
        width: 0,
        height: 0,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => {
      const aspectRatio = shape.height / shape.width

      const nextWidth = shape.width * scale
      const nextHeight = nextWidth * aspectRatio

      return {
        ...shape,
        width: nextWidth,
        height: nextHeight,
        y: top + (shape.y - bottom) * scale,
        x: right + (shape.x - left) * scale,
      }
    })
  }

  return mapSelectedShapes(shapes, (shape) => {
    const aspectRatio = shape.height / shape.width

    const nextWidth = shape.width * scale
    const nextHeight = nextWidth * aspectRatio

    return {
      ...shape,
      width: nextWidth,
      height: nextHeight,
      y: top + (shape.y - top) * scale,
      x: right + (shape.x - right) * scale,
    }
  })
}

export const resizeFromTopEdge = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const left = selectionArea.x
  const right = left + selectionArea.width

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
        x: right,
        y: bottom,
        width: 0,
        height: 0,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => {
      const aspectRatio = shape.width / shape.height

      const nextHeight = shape.height * scale
      const nextWidth = nextHeight * aspectRatio

      return {
        ...shape,
        width: nextWidth,
        height: nextHeight,
        y: bottom + (shape.y - top) * scale,
        x: right + (shape.x - left) * scale,
      }
    })
  }

  return mapSelectedShapes(shapes, (shape) => {
    const aspectRatio = shape.width / shape.height

    const nextHeight = shape.height * scale
    const nextWidth = nextHeight * aspectRatio

    return {
      ...shape,
      width: nextWidth,
      height: nextHeight,
      y: bottom + (shape.y - bottom) * scale,
      x: right + (shape.x - right) * scale,
    }
  })
}

export const resizeFromBottomEdge = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const left = selectionArea.x
  const right = left + selectionArea.width

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
        x: right,
        width: 0,
        height: 0,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => {
      const aspectRatio = shape.width / shape.height

      const nextHeight = shape.height * scale
      const nextWidth = nextHeight * aspectRatio

      return {
        ...shape,
        width: nextWidth,
        height: nextHeight,
        x: right + (shape.x - left) * scale,
        y: top + (shape.y - bottom) * scale,
      }
    })
  }

  return mapSelectedShapes(shapes, (shape) => {
    const aspectRatio = shape.width / shape.height

    const nextHeight = shape.height * scale
    const nextWidth = nextHeight * aspectRatio

    return {
      ...shape,
      width: nextWidth,
      height: nextHeight,
      y: top + (shape.y - top) * scale,
      x: right + (shape.x - right) * scale,
    }
  })
}
