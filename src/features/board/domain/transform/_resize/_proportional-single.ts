import { SELECTION_BOUNDS_PADDING, withDefaultTransformHandlers, type CalcShapeAspectResizePatch } from "../_types"

export const calcShapeRightBoundAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }, transform) => {
  const handlers = withDefaultTransformHandlers(transform)

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
        ...handlers.frizen({ ...shape, nextHeight, nextWidth })
      }
    }

    return {
      x: nextX,
      width: nextWidth,
      height: nextHeight,
      ...handlers.flip({ ...shape, nextHeight, nextWidth })
    }
  }

  return {
    width: nextWidth,
    height: nextHeight,
    ...handlers.default({ ...shape, nextHeight, nextWidth })
  }
}

export const calcShapeLeftBoundAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }, transform) => {
  const handlers = withDefaultTransformHandlers(transform)

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
        width: 0,
        height: 0,
        x: right,
        ...handlers.frizen({ ...shape, nextHeight, nextWidth }),
      }
    }

    return {
      x: right,
      width: nextWidth,
      height: nextHeight,
      ...handlers.flip({ ...shape, nextHeight, nextWidth }),
    }
  }

  return {
    x: shape.x - delta,
    width: nextWidth,
    height: nextHeight,
    ...handlers.default({ ...shape, nextHeight, nextWidth }),
  }
}

export const calcShapeBottomBoundAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }, transform) => {
  const handlers = withDefaultTransformHandlers(transform)

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
        ...handlers.frizen({ ...shape, nextWidth, nextHeight })
      }
    }

    return {
      y: nextY,
      width: nextWidth,
      height: nextHeight,
      ...handlers.flip({ ...shape, nextWidth, nextHeight })
    }
  }

  return {
    width: nextWidth,
    height: nextHeight,
    ...handlers.default({ ...shape, nextWidth, nextHeight })
  }
}

export const calcShapeTopBoundAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }, transform) => {
  const handlers = withDefaultTransformHandlers(transform)

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
        ...handlers.frizen({ ...shape, nextWidth, nextHeight })
      }
    }

    return {
      y: bottom,
      width: nextWidth,
      height: nextHeight,
      ...handlers.flip({ ...shape, nextWidth, nextHeight })
    }
  }

  return {
    y: shape.y - delta,
    width: nextWidth,
    height: nextHeight,
    ...handlers.default({ ...shape, nextWidth, nextHeight })
  }
}

export const Short = {
  bottom: calcShapeBottomBoundAspectResizePatch,
  right: calcShapeRightBoundAspectResizePatch,
  left: calcShapeLeftBoundAspectResizePatch,
  top: calcShapeTopBoundAspectResizePatch,
}