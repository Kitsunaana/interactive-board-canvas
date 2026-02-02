import { SELECTION_BOUNDS_PADDING } from "@/entities/shape"
import { isNotUndefined } from "@/shared/lib/utils"
import type { Point } from "@/shared/type/shared"
import type { GroupResizeState } from "./_get-group-resize-state"

export const calcGroupRightBoundResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, pivotX, shapes } = state

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const nextWidth = correctedCursorX - pivotX

  if (nextWidth > 0) {
    const scaleX = nextWidth / initialWidth

    return shapes.map((shape) => {
      const nextCenterX = pivotX + shape.offsetX * scaleX
      const nextWidthShape = shape.width * scaleX

      if (isNotUndefined(shape.points)) return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: pivotX + (point.x - pivotX) * scaleX,
          y: point.y,
        })),
      }

      return {
        id: shape.id,
        x: nextCenterX - nextWidthShape / 2,
        y: shape.centerY - shape.height / 2,
        width: nextWidthShape,
        height: shape.height,
        rotate: shape.rotate,
      }
    })
  }

  if (-nextWidth <= SELECTION_BOUNDS_PADDING * 2) {
    return shapes.map((shape) => {
      if (isNotUndefined(shape.points)) return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: pivotX,
          y: point.y,
        })),
      }

      return {
        id: shape.id,
        x: pivotX,
        y: shape.centerY - shape.height / 2,
        width: 0,
        height: shape.height,
        rotate: shape.rotate,
      }
    })
  }

  const flipWidth = -nextWidth - SELECTION_BOUNDS_PADDING * 2
  const scaleX = flipWidth / initialWidth

  return shapes.map((shape) => {
    const nextCenterX = pivotX - shape.offsetX * scaleX
    const nextWidthShape = shape.width * scaleX

    if (isNotUndefined(shape.points)) return {
      id: shape.id,
      rotate: shape.rotate,
      points: shape.points.map((point) => ({
        x: pivotX - (point.x - pivotX) * scaleX,
        y: point.y,
      })),
    }

    return {
      id: shape.id,
      x: nextCenterX - nextWidthShape / 2,
      y: shape.centerY - shape.height / 2,
      width: nextWidthShape,
      height: shape.height,
      rotate: shape.rotate,
    }
  })
}

export const calcGroupLeftBoundResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, pivotX, shapes } = state

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const nextWidth = pivotX - correctedCursorX

  if (nextWidth > 0) {
    const scaleX = nextWidth / initialWidth

    return shapes.map((shape) => {
      const nextCenterX = pivotX - shape.offsetX * scaleX
      const nextWidthShape = shape.width * scaleX

      if (isNotUndefined(shape.points)) return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: pivotX + (point.x - pivotX) * scaleX,
          y: point.y,
        })),
      }

      return {
        id: shape.id,
        x: nextCenterX - nextWidthShape / 2,
        y: shape.centerY - shape.height / 2,
        width: nextWidthShape,
        height: shape.height,
        rotate: shape.rotate,
      }
    })
  }

  if (-nextWidth <= SELECTION_BOUNDS_PADDING * 2) {
    return shapes.map((shape) => {
      if (isNotUndefined(shape.points)) return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: pivotX,
          y: point.y,
        })),
      }

      return {
        id: shape.id,
        x: pivotX,
        y: shape.centerY - shape.height / 2,
        width: 0,
        height: shape.height,
        rotate: shape.rotate,
      }
    })
  }

  const flipWidth = -nextWidth - SELECTION_BOUNDS_PADDING * 2
  const scaleX = flipWidth / initialWidth

  return shapes.map((shape) => {
    const nextCenterX = pivotX + shape.offsetX * scaleX
    const nextWidthShape = shape.width * scaleX

    if (isNotUndefined(shape.points)) return {
      id: shape.id,
      rotate: shape.rotate,
      points: shape.points.map((point) => ({
        x: pivotX - (point.x - pivotX) * scaleX,
        y: point.y,
      })),
    }

    return {
      id: shape.id,
      x: nextCenterX - nextWidthShape / 2,
      y: shape.centerY - shape.height / 2,
      width: nextWidthShape,
      height: shape.height,
      rotate: shape.rotate,
    }
  })
}

export const calcGroupTopBoundResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialHeight, pivotY, shapes } = state

  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING
  const nextHeight = pivotY - correctedCursorY

  if (nextHeight > 0) {
    const scaleY = nextHeight / initialHeight

    return shapes.map((shape) => {
      const nextCenterY = pivotY - shape.offsetY * scaleY
      const nextHeightShape = shape.height * scaleY

      if (isNotUndefined(shape.points)) return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: point.x,
          y: pivotY - (pivotY - point.y) * scaleY,
        })),
      }

      return {
        id: shape.id,
        x: shape.centerX - shape.width / 2,
        y: nextCenterY - nextHeightShape / 2,
        width: shape.width,
        height: nextHeightShape,
        rotate: shape.rotate,
      }
    })
  }

  if (-nextHeight <= SELECTION_BOUNDS_PADDING * 2) {
    return shapes.map((shape) => {
      if (isNotUndefined(shape.points)) return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: point.x,
          y: pivotY,
        })),
      }

      return {
        id: shape.id,
        x: shape.centerX - shape.width / 2,
        y: pivotY,
        width: shape.width,
        height: 0,
        rotate: shape.rotate,
      }
    })
  }

  const flipHeight = -nextHeight - SELECTION_BOUNDS_PADDING * 2
  const scaleY = flipHeight / initialHeight

  return shapes.map((shape) => {
    const nextCenterY = pivotY + shape.offsetY * scaleY
    const nextHeightShape = shape.height * scaleY

    if (isNotUndefined(shape.points)) return {
      id: shape.id,
      rotate: shape.rotate,
      points: shape.points.map((point) => ({
        x: point.x,
        y: pivotY + (pivotY - point.y) * scaleY,
      })),
    }

    return {
      id: shape.id,
      x: shape.centerX - shape.width / 2,
      y: nextCenterY - nextHeightShape / 2,
      width: shape.width,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

export const calcGroupBottomBoundResizePatch = (state: GroupResizeState, cursor: Point) => {
  const { initialHeight, pivotY, shapes } = state

  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING
  const nextHeight = correctedCursorY - pivotY

  if (nextHeight > 0) {
    const scaleY = nextHeight / initialHeight

    return shapes.map((shape) => {
      const nextCenterY = pivotY + shape.offsetY * scaleY
      const nextHeightShape = shape.height * scaleY

      if (isNotUndefined(shape.points)) return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: point.x,
          y: pivotY + (point.y - pivotY) * scaleY,
        })),
      }

      return {
        id: shape.id,
        x: shape.centerX - shape.width / 2,
        y: nextCenterY - nextHeightShape / 2,
        width: shape.width,
        height: nextHeightShape,
        rotate: shape.rotate,
      }
    })
  }

  if (-nextHeight <= SELECTION_BOUNDS_PADDING * 2) {
    return shapes.map((shape) => {
      if (isNotUndefined(shape.points)) return {
        id: shape.id,
        rotate: shape.rotate,
        points: shape.points.map((point) => ({
          x: point.x,
          y: pivotY,
        })),
      }

      return {
        id: shape.id,
        x: shape.centerX - shape.width / 2,
        y: pivotY,
        width: shape.width,
        height: 0,
        rotate: shape.rotate,
      }
    })
  }

  const flipHeight = -nextHeight - SELECTION_BOUNDS_PADDING * 2
  const scaleY = flipHeight / initialHeight

  return shapes.map((shape) => {
    const nextCenterY = pivotY - shape.offsetY * scaleY
    const nextHeightShape = shape.height * scaleY

    if (isNotUndefined(shape.points)) return {
      id: shape.id,
      rotate: shape.rotate,
      points: shape.points.map((point) => ({
        x: point.x,
        y: pivotY - (point.y - pivotY) * scaleY,
      })),
    }

    return {
      id: shape.id,
      x: shape.centerX - shape.width / 2,
      y: nextCenterY - nextHeightShape / 2,
      width: shape.width,
      height: nextHeightShape,
      rotate: shape.rotate,
    }
  })
}

export const groupResizeFromBound = {
  bottom: calcGroupBottomBoundResizePatch,
  right: calcGroupRightBoundResizePatch,
  left: calcGroupLeftBoundResizePatch,
  top: calcGroupTopBoundResizePatch,
}