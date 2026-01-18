import { defaultTo } from "lodash"
import type { ApplyEdgeResizeParams, ResizeSingleFromEdgeParams } from "../_shared"
import { mapSelectedShapes, SELECTION_BOUNDS_PADDING } from "../_shared"

export const applyRightEdgeResize = ({ shape, cursor }: ApplyEdgeResizeParams) => {
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
        width: 0,
        height: 0,
      }
    }

    return {
      x: nextX,
      width: nextWidth,
      height: nextHeight,
    }
  }

  return {
    width: nextWidth,
    height: nextHeight,
  }
}

export const applyLeftEdgeResize = ({ shape, cursor }: ApplyEdgeResizeParams) => {
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
        // ...shape,
        width: 0,
        height: 0,
        x: right,
      }
    }

    return {
      // ...shape,
      x: right,
      width: nextWidth,
      height: nextHeight,

      __flip: true,
    }
  }

  return {
    // ...shape,
    x: shape.x - delta,
    width: nextWidth,
    height: nextHeight,

    __flip: false,
  }
}

export const applyBottomEdgeResize = ({ shape, cursor, ...params }: ApplyEdgeResizeParams) => {
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
        y: top,
        width: 0,
        height: 0,
        ...defaultTo(params.frizen?.({ ...shape, nextWidth, nextHeight }), {})
      }
    }

    return {
      y: nextY,
      width: nextWidth,
      height: nextHeight,
      ...defaultTo(params.flip?.({ ...shape, nextWidth, nextHeight }), {})
    }
  }

  return {
    width: nextWidth,
    height: nextHeight,
    ...defaultTo(params.default?.({ ...shape, nextWidth, nextHeight }), {})
  }
}

export const applyTopEdgeResize = ({ shape, cursor, ...params }: ApplyEdgeResizeParams) => {
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
        y: bottom,
        width: 0,
        height: 0,
        ...defaultTo(params.frizen?.({ ...shape, nextWidth, nextHeight }), {})
      }
    }

    return {
      y: bottom,
      width: nextWidth,
      height: nextHeight,
      ...defaultTo(params.flip?.({ ...shape, nextWidth, nextHeight }), {})
    }
  }

  return {
    y: shape.y - delta,
    width: nextWidth,
    height: nextHeight,
    ...defaultTo(params.default?.({ ...shape, nextWidth, nextHeight }), {})
  }
}

export const resizeFromBottomEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...applyBottomEdgeResize({ cursor, shape }),
  }))
}

export const resizeFromRightEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...applyRightEdgeResize({ cursor, shape }),
  }))
}

export const resizeFromLeftEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...applyLeftEdgeResize({ cursor, shape }),
  }))
}

export const resizeFromTopEdge = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...applyTopEdgeResize({ cursor, shape }),
  }))
}
