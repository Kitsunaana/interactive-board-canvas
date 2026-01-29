import type { Point, Rect, RotatableRect } from "@/shared/type/shared"
import { SELECTION_BOUNDS_PADDING } from "../_const"

export type ShapeToAspectResize = Rect & {
  nextWidth: number
  nextHeight: number
}

export type CalcShapeAspectResizePatchTransform = {
  default?: (params: ShapeToAspectResize) => Partial<Rect>
  frizen?: (params: ShapeToAspectResize) => Partial<Rect>
  flip?: (params: ShapeToAspectResize) => Partial<Rect>
}

export type CalcShapeAspectResizePatchParms = {
  shape: RotatableRect<true>
  cursor: Point
}

export type CalcShapeAspectResizePatch = (
  params: CalcShapeAspectResizePatchParms,
  transform?: CalcShapeAspectResizePatchTransform
) => Partial<Rect>

export const calcShapeRightBoundAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const leftX = centerX - (shape.width / 2) * axisX.x
  const leftY = centerY - (shape.width / 2) * axisX.y

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y

  const toCursorX = correctedCursorX - leftX
  const toCursorY = correctedCursorY - leftY

  const projection = toCursorX * axisX.x + toCursorY * axisX.y
  const nextWidth = projection

  if (nextWidth > 0) {
    const scale = nextWidth / shape.width
    const nextHeight = shape.height * scale

    const rightX = leftX + axisX.x * nextWidth
    const rightY = leftY + axisX.y * nextWidth

    const nextCenterX = (leftX + rightX) / 2
    const nextCenterY = (leftY + rightY) / 2

    return {
      width: nextWidth,
      height: nextHeight,
      x: nextCenterX - nextWidth / 2,
      y: nextCenterY - nextHeight / 2,
    }
  }

  if (-nextWidth <= SELECTION_BOUNDS_PADDING * 2) {
    return {
      width: 0,
      height: 0,
      x: leftX,
      y: leftY,
    }
  }

  const flipWidth = -nextWidth - SELECTION_BOUNDS_PADDING * 2
  const scale = flipWidth / shape.width
  const nextHeight = shape.height * scale

  const rightX = leftX - axisX.x * flipWidth
  const rightY = leftY - axisX.y * flipWidth

  const nextCenterX = (leftX + rightX) / 2
  const nextCenterY = (leftY + rightY) / 2

  return {
    width: flipWidth,
    height: nextHeight,
    x: nextCenterX - flipWidth / 2,
    y: nextCenterY - nextHeight / 2,
  }
}

export const calcShapeLeftBoundAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const rightX = centerX + (shape.width / 2) * axisX.x
  const rightY = centerY + (shape.width / 2) * axisX.y

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y

  const toCursorX = rightX - correctedCursorX
  const toCursorY = rightY - correctedCursorY

  const projection = toCursorX * axisX.x + toCursorY * axisX.y
  const nextWidth = projection

  if (nextWidth > 0) {
    const scale = nextWidth / shape.width
    const nextHeight = shape.height * scale

    const leftX = rightX - axisX.x * nextWidth
    const leftY = rightY - axisX.y * nextWidth

    const nextCenterX = (leftX + rightX) / 2
    const nextCenterY = (leftY + rightY) / 2

    return {
      width: nextWidth,
      height: nextHeight,
      x: nextCenterX - nextWidth / 2,
      y: nextCenterY - nextHeight / 2,
    }
  }

  if (-nextWidth <= SELECTION_BOUNDS_PADDING * 2) {
    return {
      width: 0,
      height: 0,
      x: rightX,
      y: rightY,
    }
  }

  const flipWidth = -nextWidth - SELECTION_BOUNDS_PADDING * 2
  const scale = flipWidth / shape.width
  const nextHeight = shape.height * scale

  const leftX = rightX + axisX.x * flipWidth
  const leftY = rightY + axisX.y * flipWidth

  const nextCenterX = (leftX + rightX) / 2
  const nextCenterY = (leftY + rightY) / 2

  return {
    width: flipWidth,
    height: nextHeight,
    x: nextCenterX - flipWidth / 2,
    y: nextCenterY - nextHeight / 2,
  }
}

export const calcShapeBottomBoundAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisY = { x: -sin, y: cos }

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const topX = centerX - (shape.height / 2) * axisY.x
  const topY = centerY - (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - topX
  const toCursorY = correctedCursorY - topY

  const projection = toCursorX * axisY.x + toCursorY * axisY.y
  const nextHeight = projection

  if (nextHeight > 0) {
    const scale = nextHeight / shape.height
    const nextWidth = shape.width * scale

    const nextBottomX = topX + nextHeight * axisY.x
    const nextBottomY = topY + nextHeight * axisY.y

    const nextCenterX = (topX + nextBottomX) / 2
    const nextCenterY = (topY + nextBottomY) / 2

    return {
      width: nextWidth,
      height: nextHeight,
      x: nextCenterX - nextWidth / 2,
      y: nextCenterY - nextHeight / 2,
    }
  }

  if (-nextHeight <= SELECTION_BOUNDS_PADDING * 2) {
    return {
      width: 0,
      height: 0,
      x: topX,
      y: topY,
    }
  }

  const flipHeight = -nextHeight - SELECTION_BOUNDS_PADDING * 2
  const scale = flipHeight / shape.height
  const nextWidth = shape.width * scale

  const nextBottomX = topX - axisY.x * flipHeight
  const nextBottomY = topY - axisY.y * flipHeight

  const nextCenterX = (topX + nextBottomX) / 2
  const nextCenterY = (topY + nextBottomY) / 2

  return {
    width: nextWidth,
    height: flipHeight,
    x: nextCenterX - nextWidth / 2,
    y: nextCenterY - flipHeight / 2,
  }
}

export const calcShapeTopBoundAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisY = { x: -sin, y: cos }

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const bottomX = centerX + (shape.height / 2) * axisY.x
  const bottomY = centerY + (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const toBottomX = bottomX - correctedCursorX
  const toBottomY = bottomY - correctedCursorY

  const projection = toBottomX * axisY.x + toBottomY * axisY.y
  const nextHeight = projection

  if (nextHeight > 0) {
    const scale = nextHeight / shape.height
    const nextWidth = shape.width * scale

    const nextTopX = bottomX - nextHeight * axisY.x
    const nextTopY = bottomY - nextHeight * axisY.y

    const nextCenterX = (nextTopX + bottomX) / 2
    const nextCenterY = (nextTopY + bottomY) / 2

    return {
      width: nextWidth,
      height: nextHeight,
      x: nextCenterX - nextWidth / 2,
      y: nextCenterY - nextHeight / 2,
    }
  }

  const delta = (correctedCursorX - bottomX) * axisY.x + (correctedCursorY - bottomY) * axisY.y

  if (delta <= SELECTION_BOUNDS_PADDING * 2) {
    return {
      width: 0,
      height: 0,
      x: bottomX,
      y: bottomY,
    }
  }

  const flipHeight = delta - SELECTION_BOUNDS_PADDING * 2
  const scale = flipHeight / shape.height
  const nextWidth = shape.width * scale

  const nextBottomX = bottomX + axisY.x * flipHeight
  const nextBottomY = bottomY + axisY.y * flipHeight

  const nextCenterX = (bottomX + nextBottomX) / 2
  const nextCenterY = (bottomY + nextBottomY) / 2

  return {
    width: nextWidth,
    height: flipHeight,
    x: nextCenterX - nextWidth / 2,
    y: nextCenterY - flipHeight / 2,
  }
}
export const Short = {
  bottom: calcShapeBottomBoundAspectResizePatch,
  right: calcShapeRightBoundAspectResizePatch,
  left: calcShapeLeftBoundAspectResizePatch,
  top: calcShapeTopBoundAspectResizePatch,
}