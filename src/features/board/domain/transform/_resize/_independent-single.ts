import { SELECTION_BOUNDS_PADDING, type CalcShapeFromBoundResizePatch } from "../_types"

export const calcShapeRightBoundResizePatch: CalcShapeFromBoundResizePatch = ({ shape, cursor }) => {
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
        width: 0,
        x: left
      }
    }

    return {
      width: nextWidth,
      x: shape.x - nextWidth
    }
  }

  return {
    width: nextWidth
  }
}

export const calcShapeLeftBoundResizePatch: CalcShapeFromBoundResizePatch = ({ shape, cursor }) => {
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
        x: right,
        width: 0,
      }
    }

    return {
      x: right,
      width: nextWidth,
    }
  }

  return {
    width: nextWidth,
    x: shape.x - delta,
  }
}

export const calcShapeBottomBoundResizePatch: CalcShapeFromBoundResizePatch = ({ shape, cursor }) => {
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
        y: top,
        height: 0,
      }
    }

    return {
      y: nextY,
      height: nextHeight,
    }
  }

  return {
    height: nextHeight,
  }
}

export const calcShapeTopBoundResizePatch: CalcShapeFromBoundResizePatch = ({ shape, cursor }) => {
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
        y: bottom,
        height: 0,
      }
    }

    return {
      height: nextHeight,
      y: bottom
    }
  }

  return {
    height: nextHeight,
    y: shape.y - delta,
  }
}
