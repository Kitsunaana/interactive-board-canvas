import type { ApplyEdgeResizeParams, ResizeSingleFromEdgeParams } from "../_shared"
import { mapSelectedShapes, SELECTION_BOUNDS_PADDING } from "../_shared"

const applyRightEdgeResize = ({ shape, cursor }: ApplyEdgeResizeParams) => {
  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING

  const left = shape.x
  const right = left + shape.width

  const delta = cursorX - right
  const nextWidth = shape.width + delta

  if (nextWidth <= 0) {
    const delta = left - cursorX
    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2

    if (nextWidth <= 0) {
      return {
        ...shape,
        width: 0,
        x: left
      }
    }

    return {
      ...shape,
      width: nextWidth,
      x: shape.x - nextWidth
    }
  }

  return {
    ...shape,
    width: nextWidth
  }
}

const applyLeftEdgeResize = ({ shape, cursor }: ApplyEdgeResizeParams) => {
  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING

  const left = shape.x
  const right = left + shape.width

  const delta = left - cursorX
  const nextWidth = shape.width + delta

  if (nextWidth <= 0) {
    const delta = cursorX - right
    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2

    if (nextWidth <= 0) {
      return {
        ...shape,
        x: right,
        width: 0,
      }
    }

    return {
      ...shape,
      x: right,
      width: nextWidth,
    }
  }

  return {
    ...shape,
    width: nextWidth,
    x: shape.x - delta,
  }
}

const applyBottomEdgeResize = ({ shape, cursor }: ApplyEdgeResizeParams) => {
  const cursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const top = shape.y
  const bottom = top + shape.height

  const delta = cursorY - bottom
  const nextHeight = shape.height + delta

  if (nextHeight <= 0) {
    const delta = top - cursorY
    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2
    const nextY = shape.y - delta + SELECTION_BOUNDS_PADDING * 2

    if (nextHeight <= 0) {
      return {
        ...shape,
        y: top,
        height: 0,
      }
    }

    return {
      ...shape,
      y: nextY,
      height: nextHeight,
    }
  }

  return {
    ...shape,
    height: nextHeight,
  }
}

const applyTopEdgeResize = ({ shape, cursor }: ApplyEdgeResizeParams) => {
  const cursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const top = shape.y
  const bottom = top + shape.height
  
  const delta = top - cursorY
  const nextHeight = shape.height + delta

  if (nextHeight <= 0) {
    const delta = cursorY - bottom
    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2

    if (nextHeight <= 0) {
      return {
        ...shape,
        y: bottom,
        height: 0,
      }
    }

    return {
      ...shape,
      height: nextHeight,
      y: bottom
    }
  }

  return {
    ...shape,
    height: nextHeight,
    y: shape.y - delta,
  }
}

export const resizeFromRightEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyRightEdgeResize({ cursor, shape }))
}

export const resizeFromLeftEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyLeftEdgeResize({ cursor, shape }))
}

export const resizeFromBottomEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyBottomEdgeResize({ cursor, shape }))
}

export const resizeFromTopEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyTopEdgeResize({ cursor, shape }))
}
