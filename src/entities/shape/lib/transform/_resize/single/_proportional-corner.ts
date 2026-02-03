import { SELECTION_BOUNDS_PADDING } from "../../_const"
import type { CalcShapeAspectResizePatch } from "./_proportional-bound"

const calcShapeTopRightCornerAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }
  const axisY = { x: -sin, y: cos }

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const anchorX = centerX - (shape.width / 2) * axisX.x + (shape.height / 2) * axisY.x
  const anchorY = centerY - (shape.width / 2) * axisX.y + (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - anchorX
  const toCursorY = correctedCursorY - anchorY

  const projWidth = toCursorX * axisX.x + toCursorY * axisX.y
  const projHeight = -toCursorX * axisY.x - toCursorY * axisY.y

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  if (projWidth > 0 && projHeight > 0) {
    const scale = Math.min(projWidth / shape.width, projHeight / shape.height)
    const nextWidth = shape.width * scale
    const nextHeight = shape.height * scale

    const topRightX = anchorX + axisX.x * nextWidth - axisY.x * nextHeight
    const topRightY = anchorY + axisX.y * nextWidth - axisY.y * nextHeight

    const nextCenterX = (anchorX + topRightX) / 2
    const nextCenterY = (anchorY + topRightY) / 2

    return {
      width: nextWidth,
      height: nextHeight,
      x: nextCenterX - nextWidth / 2,
      y: nextCenterY - nextHeight / 2,
    }
  }

  if (-projWidth <= padding2 || -projHeight <= padding2) {
    return {
      width: 0,
      height: 0,
      x: anchorX,
      y: anchorY,
    }
  }

  const flipWidth = -projWidth - padding2
  const flipHeight = -projHeight - padding2
  const scale = Math.min(flipWidth / shape.width, flipHeight / shape.height)

  const nextWidth = shape.width * scale
  const nextHeight = shape.height * scale

  const topRightX = anchorX - axisX.x * nextWidth + axisY.x * nextHeight
  const topRightY = anchorY - axisX.y * nextWidth + axisY.y * nextHeight

  const nextCenterX = (anchorX + topRightX) / 2
  const nextCenterY = (anchorY + topRightY) / 2

  return {
    width: nextWidth,
    height: nextHeight,
    x: nextCenterX - nextWidth / 2,
    y: nextCenterY - nextHeight / 2,
  }
}

const calcShapeTopLeftCornerAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }
  const axisY = { x: -sin, y: cos }

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const anchorX = centerX + (shape.width / 2) * axisX.x + (shape.height / 2) * axisY.x
  const anchorY = centerY + (shape.width / 2) * axisX.y + (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - anchorX
  const toCursorY = correctedCursorY - anchorY

  let projWidth = -toCursorX * axisX.x - toCursorY * axisX.y
  let projHeight = -toCursorX * axisY.x - toCursorY * axisY.y

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  if (projWidth > 0 && projHeight > 0) {
    const scale = Math.min(projWidth / shape.width, projHeight / shape.height)
    const nextWidth = shape.width * scale
    const nextHeight = shape.height * scale

    const topLeftX = anchorX - axisX.x * nextWidth - axisY.x * nextHeight
    const topLeftY = anchorY - axisX.y * nextWidth - axisY.y * nextHeight

    const nextCenterX = (anchorX + topLeftX) / 2
    const nextCenterY = (anchorY + topLeftY) / 2

    return {
      width: nextWidth,
      height: nextHeight,
      x: nextCenterX - nextWidth / 2,
      y: nextCenterY - nextHeight / 2,
    }
  }

  if (-projWidth <= padding2 || -projHeight <= padding2) {
    return {
      width: 0,
      height: 0,
      x: anchorX,
      y: anchorY,
    }
  }

  const flipWidth = -projWidth - padding2
  const flipHeight = -projHeight - padding2
  const scale = Math.min(flipWidth / shape.width, flipHeight / shape.height)

  const nextWidth = shape.width * scale
  const nextHeight = shape.height * scale

  const topLeftX = anchorX
  const topLeftY = anchorY

  const bottomRightX = anchorX + axisX.x * nextWidth + axisY.x * nextHeight
  const bottomRightY = anchorY + axisX.y * nextWidth + axisY.y * nextHeight

  const nextCenterX = (topLeftX + bottomRightX) / 2
  const nextCenterY = (topLeftY + bottomRightY) / 2

  return {
    width: nextWidth,
    height: nextHeight,
    x: nextCenterX - nextWidth / 2,
    y: nextCenterY - nextHeight / 2,
  }
}

const calcShapeBottomLeftCornerAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }
  const axisY = { x: -sin, y: cos }

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const anchorX = centerX + (shape.width / 2) * axisX.x - (shape.height / 2) * axisY.x
  const anchorY = centerY + (shape.width / 2) * axisX.y - (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - anchorX
  const toCursorY = correctedCursorY - anchorY

  let projWidth = -toCursorX * axisX.x - toCursorY * axisX.y
  let projHeight = toCursorX * axisY.x + toCursorY * axisY.y

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  if (projWidth > 0 && projHeight > 0) {
    const scale = Math.min(projWidth / shape.width, projHeight / shape.height)
    const nextWidth = shape.width * scale
    const nextHeight = shape.height * scale

    const bottomLeftX = anchorX - axisX.x * nextWidth + axisY.x * nextHeight
    const bottomLeftY = anchorY - axisX.y * nextWidth + axisY.y * nextHeight

    const nextCenterX = (anchorX + bottomLeftX) / 2
    const nextCenterY = (anchorY + bottomLeftY) / 2

    return {
      width: nextWidth,
      height: nextHeight,
      x: nextCenterX - nextWidth / 2,
      y: nextCenterY - nextHeight / 2,
    }
  }

  if (-projWidth <= padding2 || -projHeight <= padding2) {
    return {
      width: 0,
      height: 0,
      x: anchorX,
      y: anchorY,
    }
  }

  const flipWidth = -projWidth - padding2
  const flipHeight = -projHeight - padding2
  const scale = Math.min(flipWidth / shape.width, flipHeight / shape.height)

  const nextWidth = shape.width * scale
  const nextHeight = shape.height * scale

  const bottomLeftX = anchorX
  const bottomLeftY = anchorY

  const topRightX = anchorX + axisX.x * nextWidth - axisY.x * nextHeight
  const topRightY = anchorY + axisX.y * nextWidth - axisY.y * nextHeight

  const nextCenterX = (bottomLeftX + topRightX) / 2
  const nextCenterY = (bottomLeftY + topRightY) / 2

  return {
    width: nextWidth,
    height: nextHeight,
    x: nextCenterX - nextWidth / 2,
    y: nextCenterY - nextHeight / 2,
  }
}

const calcShapeBottomRightCornerAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }
  const axisY = { x: -sin, y: cos }

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const anchorX = centerX - (shape.width / 2) * axisX.x - (shape.height / 2) * axisY.x
  const anchorY = centerY - (shape.width / 2) * axisX.y - (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - anchorX
  const toCursorY = correctedCursorY - anchorY

  let projWidth = toCursorX * axisX.x + toCursorY * axisX.y
  let projHeight = toCursorX * axisY.x + toCursorY * axisY.y

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  if (projWidth > 0 && projHeight > 0) {
    const scale = Math.min(projWidth / shape.width, projHeight / shape.height)
    const nextWidth = shape.width * scale
    const nextHeight = shape.height * scale

    const bottomRightX = anchorX + axisX.x * nextWidth + axisY.x * nextHeight
    const bottomRightY = anchorY + axisX.y * nextWidth + axisY.y * nextHeight

    const nextCenterX = (anchorX + bottomRightX) / 2
    const nextCenterY = (anchorY + bottomRightY) / 2

    return {
      width: nextWidth,
      height: nextHeight,
      x: nextCenterX - nextWidth / 2,
      y: nextCenterY - nextHeight / 2,
    }
  }

  if (-projWidth <= padding2 || -projHeight <= padding2) {
    return {
      width: 0,
      height: 0,
      x: anchorX,
      y: anchorY,
    }
  }

  const flipWidth = -projWidth - padding2
  const flipHeight = -projHeight - padding2
  const scale = Math.min(flipWidth / shape.width, flipHeight / shape.height)

  const nextWidth = shape.width * scale
  const nextHeight = shape.height * scale

  const bottomRightX = anchorX
  const bottomRightY = anchorY

  const topLeftX = anchorX - axisX.x * nextWidth - axisY.x * nextHeight
  const topLeftY = anchorY - axisX.y * nextWidth - axisY.y * nextHeight

  const nextCenterX = (bottomRightX + topLeftX) / 2
  const nextCenterY = (bottomRightY + topLeftY) / 2

  return {
    width: nextWidth,
    height: nextHeight,
    x: nextCenterX - nextWidth / 2,
    y: nextCenterY - nextHeight / 2,
  }
}

export const proportionalResizeFromCorner = {
  bottomRight: calcShapeBottomRightCornerAspectResizePatch,
  bottomLeft: calcShapeBottomLeftCornerAspectResizePatch,
  topRight: calcShapeTopRightCornerAspectResizePatch,
  topLeft: calcShapeTopLeftCornerAspectResizePatch,
}
