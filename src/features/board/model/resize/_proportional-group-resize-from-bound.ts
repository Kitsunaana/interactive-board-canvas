import type { Point } from "@/shared/type/shared"
import type { GroupResizeState } from "./_get-group-resize-state"
import { SELECTION_BOUNDS_PADDING } from "@/entities/shape"
import { isNotUndefined } from "@/shared/lib/utils"

export const calcGroupRightBoundProportionalResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, pivotX, pivotY, shapes } = state

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const nextWidth = correctedCursorX - pivotX

  if (nextWidth > 0) {
    const scale = nextWidth / initialWidth

    return shapes.map((shape) => {
      const nextCenterX = pivotX + shape.offsetX * scale
      const nextCenterY = pivotY + (shape.centerY - pivotY) * scale

      const nextWidthShape = shape.width * scale
      const nextHeightShape = shape.height * scale

      if (isNotUndefined(shape.points)) return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: pivotX + (point.x - pivotX) * scale,
          y: pivotY + (point.y - pivotY) * scale,
        })),
      }

      return {
        id: shape.id,
        x: nextCenterX - nextWidthShape / 2,
        y: nextCenterY - nextHeightShape / 2,
        width: nextWidthShape,
        height: nextHeightShape,
        rotate: shape.rotate,
      }
    })
  }

  if (-nextWidth <= SELECTION_BOUNDS_PADDING * 2) {
    return shapes.map((shape) => {
      if (isNotUndefined(shape.points)) return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map(() => ({
          x: pivotX,
          y: pivotY,
        })),
      }

      return {
        id: shape.id,
        x: pivotX,
        y: pivotY,
        width: 0,
        height: 0,
        rotate: shape.rotate,
      }
    })
  }

  const flipWidth = -nextWidth - SELECTION_BOUNDS_PADDING * 2
  const scale = flipWidth / initialWidth

  return shapes.map((shape) => {
    const nextCenterX = pivotX - shape.offsetX * scale
    const nextCenterY = pivotY + (shape.centerY - pivotY) * scale

    const nextWidthShape = shape.width * scale
    const nextHeightShape = shape.height * scale

    if (isNotUndefined(shape.points)) return {
      id: shape.id,
      rotate: shape.rotate,
      points: shape.points.map((point) => ({
        x: pivotX - (point.x - pivotX) * scale,
        y: pivotY + (point.y - pivotY) * scale,
      })),
    }

    return {
      id: shape.id,
      x: nextCenterX - nextWidthShape / 2,
      y: nextCenterY - nextHeightShape / 2,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

export const calcGroupLeftBoundProportionalResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, pivotX, pivotY, shapes } = state

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const nextWidth = pivotX - correctedCursorX

  if (nextWidth > 0) {
    const scale = nextWidth / initialWidth

    return shapes.map((shape) => {
      const nextCenterX = pivotX - shape.offsetX * scale
      const nextCenterY = pivotY + (shape.centerY - pivotY) * scale

      const nextWidthShape = shape.width * scale
      const nextHeightShape = shape.height * scale

      if (isNotUndefined(shape.points)) {
        return {
          id: shape.id,
          rotate: shape.rotate,
          points: shape.points.map((point) => ({
            x: nextCenterX + (point.x - shape.centerX) * scale,
            y: nextCenterY + (point.y - shape.centerY) * scale,
          })),
        }
      }

      return {
        id: shape.id,
        x: nextCenterX - nextWidthShape / 2,
        y: nextCenterY - nextHeightShape / 2,
        width: nextWidthShape,
        height: nextHeightShape,
        rotate: shape.rotate,
      }
    })
  }

  if (-nextWidth <= SELECTION_BOUNDS_PADDING * 2) {
    return shapes.map((shape) => {
      if (isNotUndefined(shape.points)) return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map(() => ({
          x: pivotX,
          y: pivotY,
        })),
      }

      return {
        id: shape.id,
        x: pivotX,
        y: pivotY,
        width: 0,
        height: 0,
        rotate: shape.rotate,
      }
    })
  }

  const flipWidth = -nextWidth - SELECTION_BOUNDS_PADDING * 2
  const scale = flipWidth / initialWidth

  return shapes.map((shape) => {
    const nextCenterX = pivotX + shape.offsetX * scale
    const nextCenterY = pivotY + shape.offsetY * scale

    const nextWidthShape = shape.width * scale
    const nextHeightShape = shape.height * scale

    if (isNotUndefined(shape.points)) return {
      id: shape.id,
      rotate: shape.rotate,
      points: shape.points.map((point) => ({
        x: nextCenterX + (point.x - shape.centerX) * scale,
        y: nextCenterY + (point.y - shape.centerY) * scale,
      })),
    }

    return {
      id: shape.id,
      x: nextCenterX - nextWidthShape / 2,
      y: nextCenterY - nextHeightShape / 2,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

export const calcGroupTopBoundProportionalResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialHeight, pivotX, pivotY, shapes } = state

  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING
  const nextHeight = pivotY - correctedCursorY

  if (nextHeight > 0) {
    const scale = nextHeight / initialHeight

    return shapes.map((shape) => {
      const nextCenterX = pivotX + (shape.centerX - pivotX) * scale
      const nextCenterY = pivotY - shape.offsetY * scale

      const nextWidthShape = shape.width * scale
      const nextHeightShape = shape.height * scale

      if (isNotUndefined(shape.points)) {
        return {
          id: shape.id,
          rotate: shape.rotate,
          points: shape.points.map((point) => ({
            x: nextCenterX + (point.x - shape.centerX) * scale,
            y: nextCenterY + (point.y - shape.centerY) * scale,
          })),
        }
      }

      return {
        id: shape.id,
        x: nextCenterX - nextWidthShape / 2,
        y: nextCenterY - nextHeightShape / 2,
        width: nextWidthShape,
        height: nextHeightShape,
        rotate: shape.rotate,
      }
    })
  }

  if (-nextHeight <= SELECTION_BOUNDS_PADDING * 2) {
    return shapes.map((shape) => {
      if (isNotUndefined(shape.points)) {
        return {
          id: shape.id,
          rotate: shape.rotate,
          points: shape.points.map(() => ({
            x: pivotX,
            y: pivotY,
          })),
        }
      }

      return {
        id: shape.id,
        x: pivotX,
        y: pivotY,
        width: 0,
        height: 0,
        rotate: shape.rotate,
      }
    })
  }

  const flipHeight = -nextHeight - SELECTION_BOUNDS_PADDING * 2
  const scale = flipHeight / initialHeight

  return shapes.map((shape) => {
    const nextCenterX = pivotX + (shape.centerX - pivotX) * scale
    const nextCenterY = pivotY + shape.offsetY * scale

    const nextWidthShape = shape.width * scale
    const nextHeightShape = shape.height * scale

    if (isNotUndefined(shape.points)) {
      return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: nextCenterX + (point.x - shape.centerX) * scale,
          y: nextCenterY + (point.y - shape.centerY) * scale,
        })),
      }
    }

    return {
      id: shape.id,
      x: nextCenterX - nextWidthShape / 2,
      y: nextCenterY - nextHeightShape / 2,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

export const calcGroupBottomBoundProportionalResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialHeight, pivotX, pivotY, shapes } = state

  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING
  const nextHeight = correctedCursorY - pivotY

  if (nextHeight > 0) {
    const scale = nextHeight / initialHeight

    return shapes.map((shape) => {
      const nextCenterX = pivotX + (shape.centerX - pivotX) * scale
      const nextCenterY = pivotY + shape.offsetY * scale

      const nextWidthShape = shape.width * scale
      const nextHeightShape = shape.height * scale

      if (isNotUndefined(shape.points)) {
        return {
          id: shape.id,
          rotate: shape.rotate,
          points: shape.points.map((point) => ({
            x: nextCenterX + (point.x - shape.centerX) * scale,
            y: nextCenterY + (point.y - shape.centerY) * scale,
          })),
        }
      }

      return {
        id: shape.id,
        x: nextCenterX - nextWidthShape / 2,
        y: nextCenterY - nextHeightShape / 2,
        width: nextWidthShape,
        height: nextHeightShape,
        rotate: shape.rotate,
      }
    })
  }

  if (-nextHeight <= SELECTION_BOUNDS_PADDING * 2) {
    return shapes.map((shape) => {
      if (isNotUndefined(shape.points)) {
        return {
          id: shape.id,
          rotate: shape.rotate,
          points: shape.points.map(() => ({
            x: pivotX,
            y: pivotY,
          })),
        }
      }

      return {
        id: shape.id,
        x: pivotX,
        y: pivotY,
        width: 0,
        height: 0,
        rotate: shape.rotate,
      }
    })
  }

  const flipHeight = -nextHeight - SELECTION_BOUNDS_PADDING * 2
  const scale = flipHeight / initialHeight

  return shapes.map((shape) => {
    const nextCenterX = pivotX + (shape.centerX - pivotX) * scale
    const nextCenterY = pivotY - shape.offsetY * scale

    const nextWidthShape = shape.width * scale
    const nextHeightShape = shape.height * scale

    if (isNotUndefined(shape.points)) {
      return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: nextCenterX + (point.x - shape.centerX) * scale,
          y: nextCenterY + (point.y - shape.centerY) * scale,
        })),
      }
    }

    return {
      id: shape.id,
      x: nextCenterX - nextWidthShape / 2,
      y: nextCenterY - nextHeightShape / 2,
      width: nextWidthShape,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}
