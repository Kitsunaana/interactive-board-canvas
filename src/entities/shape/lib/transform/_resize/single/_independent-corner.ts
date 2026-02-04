import { isNotNull } from "@/shared/lib/utils"
import { SELECTION_BOUNDS_PADDING } from "../../_const"
import type { CalcShapeResizePatch } from "./_independent-bound"

const calcShapeTopRightCornerResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }
  const axisY = { x: -sin, y: cos }

  const leftX = centerX - (shape.width / 2) * cos
  const leftY = centerY - (shape.width / 2) * sin

  const bottomX = centerX + (shape.height / 2) * -sin
  const bottomY = centerY + (shape.height / 2) * cos

  const bottomLeftX = leftX + (shape.height / 2) * axisY.x
  const bottomLeftY = leftY + (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - leftX
  const toCursorY = correctedCursorY - leftY

  const rawWidth = toCursorX * axisX.x + toCursorY * axisX.y

  const toBottomX = bottomX - correctedCursorX
  const toBottomY = bottomY - correctedCursorY

  const rawHeight = toBottomX * axisY.x + toBottomY * axisY.y

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const width =
    rawWidth > 0
      ? rawWidth
      : -rawWidth > padding2
        ? -rawWidth - padding2
        : 0

  const height =
    rawHeight > 0
      ? rawHeight
      : -rawHeight > padding2
        ? -rawHeight - padding2
        : 0

  const widthSign = rawWidth >= 0 ? 1 : -1
  const heightSign = rawHeight >= 0 ? 1 : -1

  const nextCenterX = bottomLeftX + (width / 2) * widthSign * axisX.x - (height / 2) * heightSign * axisY.x
  const nextCenterY = bottomLeftY + (width / 2) * widthSign * axisX.y - (height / 2) * heightSign * axisY.y

  const nextX = nextCenterX - width / 2
  const nextY = nextCenterY - height / 2

  if (isNotNull(shape.points)) {
    const scaleX = shape.width === 0 ? 1 : width / shape.width
    const scaleY = shape.height === 0 ? 1 : height / shape.height

    return {
      points: shape.points.map((point) => {
        const localX =
          widthSign === 1
            ? point.x - shape.x
            : shape.width - (point.x - shape.x)

        const localY =
          heightSign === 1
            ? point.y - shape.y
            : shape.height - (point.y - shape.y)

        return {
          x: nextX + localX * scaleX,
          y: nextY + localY * scaleY,
        }
      })
    }
  }

  return {
    width,
    height,
    x: nextX,
    y: nextY,
  }
}

const calcShapeTopLeftCornerResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }
  const axisY = { x: -sin, y: cos }

  const rightX = centerX + (shape.width / 2) * cos
  const rightY = centerY + (shape.width / 2) * sin

  const bottomX = centerX + (shape.height / 2) * -sin
  const bottomY = centerY + (shape.height / 2) * cos

  const bottomRightX = rightX + (shape.height / 2) * axisY.x
  const bottomRightY = rightY + (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const toCursorX = rightX - correctedCursorX
  const toCursorY = rightY - correctedCursorY

  const rawWidth = toCursorX * axisX.x + toCursorY * axisX.y

  const toBottomX = bottomX - correctedCursorX
  const toBottomY = bottomY - correctedCursorY

  const rawHeight = toBottomX * axisY.x + toBottomY * axisY.y

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const width =
    rawWidth > 0
      ? rawWidth
      : -rawWidth > padding2
        ? -rawWidth - padding2
        : 0

  const height =
    rawHeight > 0
      ? rawHeight
      : -rawHeight > padding2
        ? -rawHeight - padding2
        : 0

  const widthSign = rawWidth >= 0 ? 1 : -1
  const heightSign = rawHeight >= 0 ? 1 : -1

  const nextCenterX = bottomRightX - (width / 2) * widthSign * axisX.x - (height / 2) * heightSign * axisY.x
  const nextCenterY = bottomRightY - (width / 2) * widthSign * axisX.y - (height / 2) * heightSign * axisY.y

  const nextX = nextCenterX - width / 2
  const nextY = nextCenterY - height / 2

  if (isNotNull(shape.points)) {
    const scaleX = shape.width === 0 ? 1 : width / shape.width
    const scaleY = shape.height === 0 ? 1 : height / shape.height

    return {
      points: shape.points.map((point) => {
        const baseLocalX = point.x - shape.x
        const baseLocalY = point.y - shape.y

        const localX =
          widthSign === 1
            ? baseLocalX
            : shape.width - baseLocalX

        const localY =
          heightSign === 1
            ? baseLocalY
            : shape.height - baseLocalY

        return {
          x: nextX + localX * scaleX,
          y: nextY + localY * scaleY,
        }
      })
    }
  }


  return {
    width,
    height,
    x: nextX,
    y: nextY,
  }
}

const calcShapeBottomRightCornerResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }
  const axisY = { x: -sin, y: cos }

  const leftX = centerX - (shape.width / 2) * cos
  const leftY = centerY - (shape.width / 2) * sin

  const topX = centerX - (shape.height / 2) * -sin
  const topY = centerY - (shape.height / 2) * cos

  const topLeftX = leftX - (shape.height / 2) * axisY.x
  const topLeftY = leftY - (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - leftX
  const toCursorY = correctedCursorY - leftY

  const rawWidth = toCursorX * axisX.x + toCursorY * axisX.y

  const toTopX = correctedCursorX - topX
  const toTopY = correctedCursorY - topY

  const rawHeight = toTopX * axisY.x + toTopY * axisY.y

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const width =
    rawWidth > 0
      ? rawWidth
      : -rawWidth > padding2
        ? -rawWidth - padding2
        : 0

  const height =
    rawHeight > 0
      ? rawHeight
      : -rawHeight > padding2
        ? -rawHeight - padding2
        : 0

  const widthSign = rawWidth >= 0 ? 1 : -1
  const heightSign = rawHeight >= 0 ? 1 : -1

  const nextCenterX = topLeftX + (width / 2) * widthSign * axisX.x + (height / 2) * heightSign * axisY.x
  const nextCenterY = topLeftY + (width / 2) * widthSign * axisX.y + (height / 2) * heightSign * axisY.y

  const nextX = nextCenterX - width / 2
  const nextY = nextCenterY - height / 2

  if (isNotNull(shape.points)) {
    const scaleX = shape.width === 0 ? 1 : width / shape.width
    const scaleY = shape.height === 0 ? 1 : height / shape.height

    return {
      points: shape.points.map((point) => {
        const baseLocalX = point.x - shape.x
        const baseLocalY = point.y - shape.y

        const localX =
          widthSign === 1
            ? baseLocalX
            : shape.width - baseLocalX

        const localY =
          heightSign === 1
            ? baseLocalY
            : shape.height - baseLocalY

        return {
          x: nextX + localX * scaleX,
          y: nextY + localY * scaleY,
        }
      })
    }
  }

  return {
    width,
    height,
    x: nextX,
    y: nextY,
  }
}

const calcShapeBottomLeftCornerResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }
  const axisY = { x: -sin, y: cos }

  const rightX = centerX + (shape.width / 2) * cos
  const rightY = centerY + (shape.width / 2) * sin

  const topX = centerX - (shape.height / 2) * -sin
  const topY = centerY - (shape.height / 2) * cos

  const topRightX = rightX - (shape.height / 2) * axisY.x
  const topRightY = rightY - (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const toCursorX = rightX - correctedCursorX
  const toCursorY = rightY - correctedCursorY

  const rawWidth = toCursorX * axisX.x + toCursorY * axisX.y

  const toTopX = correctedCursorX - topX
  const toTopY = correctedCursorY - topY

  const rawHeight = toTopX * axisY.x + toTopY * axisY.y

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const width =
    rawWidth > 0
      ? rawWidth
      : -rawWidth > padding2
        ? -rawWidth - padding2
        : 0

  const height =
    rawHeight > 0
      ? rawHeight
      : -rawHeight > padding2
        ? -rawHeight - padding2
        : 0

  const widthSign = rawWidth >= 0 ? 1 : -1
  const heightSign = rawHeight >= 0 ? 1 : -1

  const nextCenterX = topRightX - (width / 2) * widthSign * axisX.x + (height / 2) * heightSign * axisY.x
  const nextCenterY = topRightY - (width / 2) * widthSign * axisX.y + (height / 2) * heightSign * axisY.y

  const nextX = nextCenterX - width / 2
  const nextY = nextCenterY - height / 2

  if (isNotNull(shape.points)) {
    const scaleX = shape.width === 0 ? 1 : width / shape.width
    const scaleY = shape.height === 0 ? 1 : height / shape.height

    return {
      points: shape.points.map((point) => {
        const baseLocalX = point.x - shape.x
        const baseLocalY = point.y - shape.y

        const localX =
          widthSign === 1
            ? baseLocalX
            : shape.width - baseLocalX

        const localY =
          heightSign === 1
            ? baseLocalY
            : shape.height - baseLocalY

        return {
          x: nextX + localX * scaleX,
          y: nextY + localY * scaleY,
        }
      })
    }
  }

  return {
    width,
    height,
    x: nextX,
    y: nextY,
  }
}

export const independentResizeFromCorner = {
  bottomRight: calcShapeBottomRightCornerResizePatch,
  bottomLeft: calcShapeBottomLeftCornerResizePatch,
  topRight: calcShapeTopRightCornerResizePatch,
  topLeft: calcShapeTopLeftCornerResizePatch,
}