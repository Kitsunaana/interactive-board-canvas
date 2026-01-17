import { SELECTION_BOUNDS_PADDING } from "@/features/board/ui/selection-bounds-area"
import type { ShapeToView } from "../../_shape"
import { mapSelectedShapes, type ApplyEdgeResizeParams, type ResizeSingleFromEdgeParams } from "../_shared"

const applyRightEdgeResize = ({ shape, cursor }: ApplyEdgeResizeParams): ShapeToView => {
  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING

  const left = shape.x
  const right = left + shape.width

  const delta = cursorX - right
  const aspectRatio = shape.height / shape.width

  const nextWidth = shape.width + delta
  const nextHeight = nextWidth * aspectRatio

  if (nextWidth <= 0) {
    const delta = left - cursorX

    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2
    const nextHeight = nextWidth * aspectRatio
    const nextX = shape.x - delta + SELECTION_BOUNDS_PADDING * 2

    if (nextWidth <= 0) {
      return {
        ...shape,
        width: 0,
        height: 0,
      }
    }

    return {
      ...shape,
      x: nextX,
      width: nextWidth,
      height: nextHeight,
    }
  }

  return {
    ...shape,
    width: nextWidth,
    height: nextHeight,
  }
}

const applyLeftEdgeResize = ({ shape, cursor }: ApplyEdgeResizeParams): ShapeToView => {
  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING

  const left = shape.x
  const right = left + shape.width

  const delta = left - cursorX
  const aspectRatio = shape.height / shape.width

  const nextWidth = shape.width + delta
  const nextHeight = nextWidth * aspectRatio

  if (nextWidth <= 0) {
    const delta = cursorX - right

    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2
    const nextHeight = nextWidth * aspectRatio

    if (nextWidth <= 0) {
      return {
        ...shape,
        width: 0,
        height: 0,
        x: right,
      }
    }

    return {
      ...shape,
      x: right,
      width: nextWidth,
      height: nextHeight,
    }
  }

  return {
    ...shape,
    x: shape.x - delta,
    width: nextWidth,
    height: nextHeight,
  }
}

const applyBottomEdgeResize = ({ shape, cursor }: ApplyEdgeResizeParams): ShapeToView => {
  const cursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const top = shape.y
  const bottom = top + shape.height

  const delta = cursorY - bottom
  const aspectRatio = shape.width / shape.height

  const nextHeight = shape.height + delta
  const nextWidth = nextHeight * aspectRatio

  if (nextHeight <= 0) {
    const delta = top - cursorY

    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2
    const nextWidth = nextHeight * aspectRatio
    const nextY = top - delta + SELECTION_BOUNDS_PADDING * 2

    if (nextHeight <= 0) {
      return {
        ...shape,
        y: top,
        width: 0,
        height: 0,
      }
    }

    return {
      ...shape,
      y: nextY,
      width: nextWidth,
      height: nextHeight,
    }
  }

  return {
    ...shape,
    width: nextWidth,
    height: nextHeight,
  }
}

const applyTopEdgeResize = ({ shape, cursor }: ApplyEdgeResizeParams): ShapeToView => {
  const cursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const top = shape.y
  const bottom = top + shape.height

  const delta = top - cursorY
  const aspectRatio = shape.width / shape.height

  const nextHeight = shape.height + delta
  const nextWidth = nextHeight * aspectRatio

  if (nextHeight <= 0) {
    const delta = cursorY - bottom
    
    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2
    const nextWidth = nextHeight * aspectRatio
    
    if (nextHeight <= 0) {
      return {
        ...shape,
        y: bottom,
        width: 0,
        height: 0,
      }
    }

    return {
      ...shape,
      y: bottom,
      width: nextWidth,
      height: nextHeight,
    }
  }

  return {
    ...shape,
    y: shape.y - delta,
    width: nextWidth,
    height: nextHeight,
  }
}

export const resizeFromBottomEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyBottomEdgeResize({ cursor, shape }))
}

export const resizeFromRightEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyRightEdgeResize({ cursor, shape }))
}

export const resizeFromLeftEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyLeftEdgeResize({ cursor, shape }))
}

export const resizeFromTopEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyTopEdgeResize({ cursor, shape }))
}
