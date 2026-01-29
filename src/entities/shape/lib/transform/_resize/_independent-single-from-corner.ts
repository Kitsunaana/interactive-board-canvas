import type { Corner } from "@/features/board/domain/selection-area"
import { SELECTION_BOUNDS_PADDING } from "../_const"
import type { CalcShapeResizePatch } from "./_independent-single-from-bound"

const calcShapeTopRightCornerResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
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
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - anchorX
  const toCursorY = correctedCursorY - anchorY

  const projX = toCursorX * axisX.x + toCursorY * axisX.y
  const projY = toCursorX * axisY.x + toCursorY * axisY.y

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  let width = 0
  let widthSign = 1

  if (projX > 0) {
    width = projX
  } else if (-projX > padding2) {
    width = -projX - padding2
    widthSign = -1
  }

  let height = 0
  let heightSign = 1

  if (projY > 0) {
    height = projY
  } else if (-projY > padding2) {
    height = -projY - padding2
    heightSign = -1
  }

  const centerFromAnchorX = (width * widthSign) / 2 * axisX.x + (height * heightSign) / 2 * axisY.x
  const centerFromAnchorY = (width * widthSign) / 2 * axisX.y + (height * heightSign) / 2 * axisY.y

  const nextCenterX = anchorX + centerFromAnchorX
  const nextCenterY = anchorY + centerFromAnchorY

  return {
    width,
    height,
    x: nextCenterX - width / 2,
    y: nextCenterY - height / 2,
  }
}

const calcShapeTopLeftCornerResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
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
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - anchorX
  const toCursorY = correctedCursorY - anchorY

  const projX = -(toCursorX * axisX.x + toCursorY * axisX.y)
  const projY = toCursorX * axisY.x + toCursorY * axisY.y

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  let width = 0
  let widthSign = -1

  if (projX > 0) {
    width = projX
  } else if (-projX > padding2) {
    width = -projX - padding2
    widthSign = 1
  }

  let height = 0
  let heightSign = 1

  if (projY > 0) {
    height = projY
  } else if (-projY > padding2) {
    height = -projY - padding2
    heightSign = -1
  }

  const centerFromAnchorX = (width * widthSign) / 2 * axisX.x + (height * heightSign) / 2 * axisY.x
  const centerFromAnchorY = (width * widthSign) / 2 * axisX.y + (height * heightSign) / 2 * axisY.y

  const nextCenterX = anchorX + centerFromAnchorX
  const nextCenterY = anchorY + centerFromAnchorY

  return {
    width,
    height,
    x: nextCenterX - width / 2,
    y: nextCenterY - height / 2,
  }
}

const calcShapeBottomRightCornerResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }
  const axisY = { x: -sin, y: cos }

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const anchorX = centerX - (shape.width / 2) * axisX.x - (shape.height / 2) * axisY.x
  const anchorY = centerY - (shape.width / 2) * axisX.y - (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - anchorX
  const toCursorY = correctedCursorY - anchorY

  const projX = toCursorX * axisX.x + toCursorY * axisX.y
  const projY = -(toCursorX * axisY.x + toCursorY * axisY.y)

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  let width = 0
  let widthSign = 1

  if (projX > 0) {
    width = projX
  } else if (-projX > padding2) {
    width = -projX - padding2
    widthSign = -1
  }

  let height = 0
  let heightSign = -1

  if (projY > 0) {
    height = projY
  } else if (-projY > padding2) {
    height = -projY - padding2
    heightSign = 1
  }

  const nextCenterX = anchorX + (width * widthSign) / 2 * axisX.x + (height * heightSign) / 2 * axisY.x
  const nextCenterY = anchorY + (width * widthSign) / 2 * axisX.y + (height * heightSign) / 2 * axisY.y

  return {
    width,
    height,
    x: nextCenterX - width / 2,
    y: nextCenterY - height / 2,
  }
}

const calcShapeBottomLeftCornerResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
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
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const toCursorX = correctedCursorX - anchorX
  const toCursorY = correctedCursorY - anchorY

  const projX = -(toCursorX * axisX.x + toCursorY * axisX.y)
  const projY = -(toCursorX * axisY.x + toCursorY * axisY.y)

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  let width = 0
  let widthSign = -1

  if (projX > 0) {
    width = projX
  } else if (-projX > padding2) {
    width = -projX - padding2
    widthSign = 1
  }

  let height = 0
  let heightSign = -1

  if (projY > 0) {
    height = projY
  } else if (-projY > padding2) {
    height = -projY - padding2
    heightSign = 1
  }

  const nextCenterX = anchorX + (width * widthSign) / 2 * axisX.x + (height * heightSign) / 2 * axisY.x
  const nextCenterY = anchorY + (width * widthSign) / 2 * axisX.y + (height * heightSign) / 2 * axisY.y

  return {
    width,
    height,
    x: nextCenterX - width / 2,
    y: nextCenterY - height / 2,
  }
}

export const calcShapeFromCornerIndependentResizePatch: Record<Corner, CalcShapeResizePatch> = {
  bottomRight: calcShapeBottomRightCornerResizePatch,
  bottomLeft: calcShapeBottomLeftCornerResizePatch,
  topRight: calcShapeTopRightCornerResizePatch,
  topLeft: calcShapeTopLeftCornerResizePatch,
}