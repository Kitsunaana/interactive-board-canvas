import type { Point, Rect, RotatableRect } from "@/shared/type/shared"
import { SELECTION_BOUNDS_PADDING } from "../../_const"
import { isNotNull } from "@/shared/lib/utils"

export type CalcShapeResizePatchParams = {
  shape: RotatableRect<true> & { points: null | Point[] }
  cursor: Point
}

export type CalcShapeResizePatch = (params: CalcShapeResizePatchParams) => Partial<Rect & { points: null | Point[] }>

const calcShapeRightBoundResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const leftX = centerX - (shape.width / 2) * cos
  const leftY = centerY - (shape.width / 2) * sin

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y

  const toCursorX = correctedCursorX - leftX
  const toCursorY = correctedCursorY - leftY

  const axisX = { x: cos, y: sin }

  const dot = toCursorX * axisX.x + toCursorY * axisX.y
  const axisLength = Math.sqrt(axisX.x * axisX.x + axisX.y * axisX.y)
  const projection = dot / axisLength

  const nextWidth = projection

  if (nextWidth > 0) {
    const nextCenterX = leftX + (nextWidth / 2) * axisX.x
    const nextCenterY = leftY + (nextWidth / 2) * axisX.y

    const nextX = nextCenterX - (nextWidth / 2)
    const nextY = nextCenterY - (shape.height / 2)

    if (isNotNull(shape.points)) {
      const scaleX = nextWidth / shape.width

      return {
        points: shape.points.map((point) => ({
          x: nextX + (point.x - shape.x) * scaleX,
          y: nextY + (point.y - shape.y),
        }))
      }
    }

    return {
      width: nextWidth,
      x: nextX,
      y: nextY,
    }
  }

  const delta = leftX - correctedCursorX

  if (delta <= SELECTION_BOUNDS_PADDING * 2) {
    const nextX = leftX
    const nextY = leftY - (shape.height / 2)

    if (isNotNull(shape.points)) {
      return {
        points: shape.points.map((point) => ({
          x: nextX + (point.x - shape.x) * 0,
          y: nextY + (point.y - shape.y),
        }))
      }
    }

    return {
      width: 0,
      x: nextX,
      y: nextY,
    }
  }

  const flipWidth = delta - SELECTION_BOUNDS_PADDING * 2

  const nextLeftX = leftX - axisX.x * flipWidth
  const nextLeftY = leftY - axisX.y * flipWidth

  const nextCenterX = (nextLeftX + leftX) / 2
  const nextCenterY = (nextLeftY + leftY) / 2

  const nextX = nextCenterX - (flipWidth / 2)
  const nextY = nextCenterY - (shape.height / 2)

  if (isNotNull(shape.points)) {
    const scaleX = flipWidth / shape.width

    return {
      points: shape.points.map((point) => {
        const localX = point.x - shape.x
        const flippedLocalX = shape.width - localX
        const scaledLocalX = flippedLocalX * scaleX

        return {
          x: nextX + scaledLocalX,
          y: nextY + (point.y - shape.y),
        }
      })
    }
  }

  return {
    width: flipWidth,
    x: nextX,
    y: nextY,
  }
}

const calcShapeLeftBoundResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const rightX = centerX + (shape.width / 2) * cos
  const rightY = centerY + (shape.width / 2) * sin

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y

  const toRightX = rightX - correctedCursorX
  const toRightY = rightY - correctedCursorY

  const axisX = { x: cos, y: sin }

  const dot = toRightX * axisX.x + toRightY * axisX.y
  const axisLength = Math.sqrt(axisX.x * axisX.x + axisX.y * axisX.y)
  const projection = dot / axisLength

  const nextWidth = projection

  if (nextWidth > 0) {
    const nextLeftX = rightX - nextWidth * axisX.x
    const nextLeftY = rightY - nextWidth * axisX.y

    const nextCenterX = (nextLeftX + rightX) / 2
    const nextCenterY = (nextLeftY + rightY) / 2

    const nextX = nextCenterX - (nextWidth / 2)
    const nextY = nextCenterY - (shape.height / 2)

    if (isNotNull(shape.points)) {
      const scaleX = nextWidth / shape.width

      return {
        points: shape.points.map((point) => ({
          x: nextX + (point.x - shape.x) * scaleX,
          y: nextY + (point.y - shape.y),
        }))
      }
    }

    return {
      width: nextWidth,
      x: nextX,
      y: nextY,
    }
  }

  const delta = correctedCursorX - rightX

  if (delta <= SELECTION_BOUNDS_PADDING * 2) {
    const nextX = rightX
    const nextY = rightY - (shape.height / 2)

    if (isNotNull(shape.points)) {
      return {
        points: shape.points.map((point) => ({
          x: nextX + (point.x - shape.x) * 0,
          y: nextY + (point.y - shape.y),
        }))
      }
    }

    return {
      width: 0,
      x: nextX,
      y: nextY,
    }
  }

  const flipWidth = delta - SELECTION_BOUNDS_PADDING * 2

  const nextRightX = rightX + axisX.x * flipWidth
  const nextRightY = rightY + axisX.y * flipWidth

  const nextCenterX = (rightX + nextRightX) / 2
  const nextCenterY = (rightY + nextRightY) / 2

  const nextX = nextCenterX - (flipWidth / 2)
  const nextY = nextCenterY - (shape.height / 2)

  if (isNotNull(shape.points)) {
    const scaleX = flipWidth / shape.width

    return {
      points: shape.points.map((point) => {
        const localX = point.x - shape.x
        const flippedLocalX = shape.width - localX
        const scaledLocalX = flippedLocalX * scaleX

        return {
          x: nextX + scaledLocalX,
          y: nextY + (point.y - shape.y),
        }
      })
    }
  }

  return {
    width: flipWidth,
    x: nextX,
    y: nextY,
  }
}

const calcShapeBottomBoundResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const topX = centerX - (shape.height / 2) * -sin
  const topY = centerY - (shape.height / 2) * cos

  const correctedCursorX = cursor.x
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - topX
  const toCursorY = correctedCursorY - topY

  const axisY = { x: -sin, y: cos }

  const dot = toCursorX * axisY.x + toCursorY * axisY.y
  const axisLength = Math.sqrt(axisY.x * axisY.x + axisY.y * axisY.y)
  const projection = dot / axisLength

  const nextHeight = projection

  if (nextHeight > 0) {
    const nextBottomX = topX + nextHeight * axisY.x
    const nextBottomY = topY + nextHeight * axisY.y

    const nextCenterX = (topX + nextBottomX) / 2
    const nextCenterY = (topY + nextBottomY) / 2

    const nextX = nextCenterX - (shape.width / 2)
    const nextY = nextCenterY - (nextHeight / 2)

    if (isNotNull(shape.points)) {
      const scaleY = nextHeight / shape.height

      return {
        points: shape.points.map((point) => ({
          x: nextX + (point.x - shape.x),
          y: nextY + (point.y - shape.y) * scaleY,
        }))
      }
    }

    return {
      height: nextHeight,
      x: nextX,
      y: nextY,
    }
  }

  const delta = topY - correctedCursorY

  if (delta <= SELECTION_BOUNDS_PADDING * 2) {
    const nextX = topX - (shape.width / 2)
    const nextY = topY

    if (isNotNull(shape.points)) {
      return {
        points: shape.points.map((point) => ({
          x: nextX + (point.x - shape.x),
          y: nextY + (point.y - shape.y) * 0,
        }))
      }
    }

    return {
      height: 0,
      x: nextX,
      y: nextY,
    }
  }

  const flipHeight = delta - SELECTION_BOUNDS_PADDING * 2

  const nextTopX = topX - axisY.x * flipHeight
  const nextTopY = topY - axisY.y * flipHeight

  const nextCenterX = (topX + nextTopX) / 2
  const nextCenterY = (topY + nextTopY) / 2

  const nextX = nextCenterX - (shape.width / 2)
  const nextY = nextCenterY - (flipHeight / 2)

  if (isNotNull(shape.points)) {
    const scaleY = flipHeight / shape.height

    return {
      points: shape.points.map((point) => {
        const localY = point.y - shape.y
        const flippedLocalY = shape.height - localY
        const scaledLocalY = flippedLocalY * scaleY

        return {
          x: nextX + (point.x - shape.x),
          y: nextY + scaledLocalY,
        }
      })
    }
  }

  return {
    height: flipHeight,
    x: nextX,
    y: nextY,
  }
}

const calcShapeTopBoundResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const bottomX = centerX + (shape.height / 2) * -sin
  const bottomY = centerY + (shape.height / 2) * cos

  const correctedCursorX = cursor.x
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const toBottomX = bottomX - correctedCursorX
  const toBottomY = bottomY - correctedCursorY

  const axisY = { x: -sin, y: cos }

  const dot = toBottomX * axisY.x + toBottomY * axisY.y
  const axisLength = Math.sqrt(axisY.x * axisY.x + axisY.y * axisY.y)
  const projection = dot / axisLength

  const nextHeight = projection

  if (nextHeight > 0) {
    const nextTopX = bottomX - nextHeight * axisY.x
    const nextTopY = bottomY - nextHeight * axisY.y

    const nextCenterX = (nextTopX + bottomX) / 2
    const nextCenterY = (nextTopY + bottomY) / 2

    const nextX = nextCenterX - (shape.width / 2)
    const nextY = nextCenterY - (nextHeight / 2)

    if (isNotNull(shape.points)) {
      const scaleY = nextHeight / shape.height

      return {
        points: shape.points.map((point) => ({
          x: nextX + (point.x - shape.x),
          y: nextY + (point.y - shape.y) * scaleY,
        }))
      }
    }

    return {
      height: nextHeight,
      x: nextX,
      y: nextY,
    }
  }

  const delta = correctedCursorY - bottomY

  if (delta <= SELECTION_BOUNDS_PADDING * 2) {
    const nextX = bottomX - (shape.width / 2)
    const nextY = bottomY

    if (isNotNull(shape.points)) {
      return {
        points: shape.points.map((point) => ({
          x: nextX + (point.x - shape.x),
          y: nextY + (point.y - shape.y) * 0,
        }))
      }
    }

    return {
      height: 0,
      x: nextX,
      y: nextY,
    }
  }

  const flipHeight = delta - SELECTION_BOUNDS_PADDING * 2

  const nextBottomX = bottomX + axisY.x * flipHeight
  const nextBottomY = bottomY + axisY.y * flipHeight

  const nextCenterX = (bottomX + nextBottomX) / 2
  const nextCenterY = (bottomY + nextBottomY) / 2

  const nextX = nextCenterX - (shape.width / 2)
  const nextY = nextCenterY - (flipHeight / 2)

  if (isNotNull(shape.points)) {
    const scaleY = flipHeight / shape.height

    return {
      points: shape.points.map((point) => {
        const localY = point.y - shape.y
        const flippedLocalY = shape.height - localY
        const scaledLocalY = flippedLocalY * scaleY

        return {
          x: nextX + (point.x - shape.x),
          y: nextY + scaledLocalY,
        }
      })
    }
  }

  return {
    height: flipHeight,
    x: nextX,
    y: nextY,
  }
}

export const independentResizeFromBound = {
  bottom: calcShapeBottomBoundResizePatch,
  right: calcShapeRightBoundResizePatch,
  left: calcShapeLeftBoundResizePatch,
  top: calcShapeTopBoundResizePatch,
}
