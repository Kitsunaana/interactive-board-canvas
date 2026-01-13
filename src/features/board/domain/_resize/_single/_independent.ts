import { PADDING } from "@/features/board/view-model/sticker"
import { mapSelectedShapes, type ApplyEdgeResizeParams, type ResizeSingleFromEdgeParams } from "../_shared"

const applyRightEdgeResize = ({ shape, cursor }: ApplyEdgeResizeParams) => {
  const cursorX = cursor.x - PADDING

  const left = shape.x
  const right = left + shape.width

  const delta = cursorX - right
  const nextWidth = shape.width + delta

  if (nextWidth <= 0) {
    const delta = left - cursorX
    const nextWidth = delta - PADDING * 2

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
  const cursorX = cursor.x + PADDING

  const left = shape.x
  const right = left + shape.width

  const delta = left - cursorX
  const nextWidth = shape.width + delta

  if (nextWidth <= 0) {
    const delta = cursorX - right
    const nextWidth = delta - PADDING * 2

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
  const cursorY = cursor.y - PADDING

  const top = shape.y
  const bottom = top + shape.height

  const delta = cursorY - bottom
  const nextHeight = shape.height + delta

  if (nextHeight <= 0) {
    const delta = top - cursorY
    const nextHeight = delta - PADDING * 2
    const nextY = shape.y - delta + PADDING * 2

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
  const cursorY = cursor.y + PADDING

  const top = shape.y
  const bottom = top + shape.height
  
  const delta = top - cursorY
  const nextHeight = shape.height + delta

  if (nextHeight <= 0) {
    const delta = cursorY - bottom
    const nextHeight = delta - PADDING * 2

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

const resizeFromRightEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyRightEdgeResize({ cursor, shape }))
}

const resizeFromLeftEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyLeftEdgeResize({ cursor, shape }))
}

const resizeFromBottomEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyBottomEdgeResize({ cursor, shape }))
}

const resizeFromTopEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => applyTopEdgeResize({ cursor, shape }))
}


export const independent = {
  bottom: resizeFromBottomEdge,
  right: resizeFromRightEdge,
  left: resizeFromLeftEdge,
  top: resizeFromTopEdge,
}