import { SELECTION_BOUNDS_PADDING } from "../../_const"
import type { CalcShapeAspectResizePatch } from "./_proportional-bound"

const calcShapeBottomLeftCornerAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: -cos, y: -sin }
  const axisY = { x: -sin, y: cos }

  const rightX = centerX + (shape.width / 2) * cos
  const rightY = centerY + (shape.width / 2) * sin

  const topRightX = rightX - (shape.height / 2) * axisY.x
  const topRightY = rightY - (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const diagonalX = shape.width * axisX.x + shape.height * axisY.x
  const diagonalY = shape.width * axisX.y + shape.height * axisY.y

  const originalLength = Math.sqrt(diagonalX ** 2 + diagonalY ** 2) || 1

  const cursorVecX = correctedCursorX - topRightX
  const cursorVecY = correctedCursorY - topRightY

  const projLength = (cursorVecX * diagonalX + cursorVecY * diagonalY) / originalLength
  const scale = projLength / originalLength
  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const flippedDelta = -projLength
  const flipLength = flippedDelta - padding2
  const flipScale = flipLength / originalLength

  const isNormal = scale > 0
  const isFreeze = flippedDelta <= padding2

  const width = isNormal ? scale * shape.width : isFreeze ? 0 : flipScale * shape.width
  const height = isNormal ? scale * shape.height : isFreeze ? 0 : flipScale * shape.height

  const widthSign = isNormal ? 1 : isFreeze ? 1 : -1
  const heightSign = isNormal ? 1 : isFreeze ? 1 : -1

  const nextCenterX = topRightX + (width / 2) * widthSign * axisX.x + (height / 2) * heightSign * axisY.x
  const nextCenterY = topRightY + (width / 2) * widthSign * axisX.y + (height / 2) * heightSign * axisY.y

  const nextX = nextCenterX - width / 2
  const nextY = nextCenterY - height / 2

  const scaleX = shape.width === 0 ? 1 : width / shape.width
  const scaleY = shape.height === 0 ? 1 : height / shape.height

  const nextGeometry = (shape?.points ?? []).map((point) => {
    const localX = widthSign === 1
      ? point.x - shape.x
      : shape.width - (point.x - shape.x)
    const localY = heightSign === 1
      ? point.y - shape.y
      : shape.height - (point.y - shape.y)

    return {
      x: nextX + localX * scaleX,
      y: nextY + localY * scaleY,
    }
  })

  return {
    width,
    height,
    x: nextX,
    y: nextY,
    points: nextGeometry,
  }
}

const calcShapeTopRightCornerAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }
  const axisY = { x: -sin, y: cos }

  const leftX = centerX - (shape.width / 2) * cos
  const leftY = centerY - (shape.width / 2) * sin

  const bottomLeftX = leftX + (shape.height / 2) * axisY.x
  const bottomLeftY = leftY + (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const diagonalX = shape.width * axisX.x - shape.height * axisY.x
  const diagonalY = shape.width * axisX.y - shape.height * axisY.y

  const originalLength = Math.sqrt(diagonalX ** 2 + diagonalY ** 2) || 1

  const cursorVecX = correctedCursorX - bottomLeftX
  const cursorVecY = correctedCursorY - bottomLeftY

  const projLength = (cursorVecX * diagonalX + cursorVecY * diagonalY) / originalLength

  const scale = projLength / originalLength

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const flippedDelta = -projLength
  const flipLength = flippedDelta - padding2
  const flipScale = flipLength / originalLength

  const isNormal = scale > 0
  const isFreeze = flippedDelta <= padding2

  const width = isNormal ? scale * shape.width : isFreeze ? 0 : flipScale * shape.width
  const height = isNormal ? scale * shape.height : isFreeze ? 0 : flipScale * shape.height
  const widthSign = isNormal ? 1 : isFreeze ? 1 : -1
  const heightSign = isNormal ? 1 : isFreeze ? 1 : -1

  const nextCenterX = bottomLeftX + (width / 2) * widthSign * axisX.x - (height / 2) * heightSign * axisY.x
  const nextCenterY = bottomLeftY + (width / 2) * widthSign * axisX.y - (height / 2) * heightSign * axisY.y

  const nextX = nextCenterX - width / 2
  const nextY = nextCenterY - height / 2

  const scaleX = shape.width === 0 ? 1 : width / shape.width
  const scaleY = shape.height === 0 ? 1 : height / shape.height

  const nextGeometry = (shape?.points ?? []).map((point) => {
    const localX = widthSign === 1
      ? point.x - shape.x
      : shape.width - (point.x - shape.x)

    const localY = heightSign === 1
      ? point.y - shape.y
      : shape.height - (point.y - shape.y)

    return {
      x: nextX + localX * scaleX,
      y: nextY + localY * scaleY,
    }
  })

  return {
    width,
    height,
    x: nextX,
    y: nextY,
    points: nextGeometry,
  }
}

const calcShapeTopLeftCornerAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: -cos, y: -sin }
  const axisY = { x: -sin, y: cos }

  const rightX = centerX + (shape.width / 2) * cos
  const rightY = centerY + (shape.width / 2) * sin

  const bottomRightX = rightX + (shape.height / 2) * axisY.x
  const bottomRightY = rightY + (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const diagonalX = shape.width * axisX.x - shape.height * axisY.x
  const diagonalY = shape.width * axisX.y - shape.height * axisY.y

  const originalLength = Math.sqrt(diagonalX ** 2 + diagonalY ** 2) || 1

  const cursorVecX = correctedCursorX - bottomRightX
  const cursorVecY = correctedCursorY - bottomRightY

  const projLength = (cursorVecX * diagonalX + cursorVecY * diagonalY) / originalLength
  const scale = projLength / originalLength

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const flippedDelta = -projLength
  const flipLength = flippedDelta - padding2
  const flipScale = flipLength / originalLength

  const isNormal = scale > 0
  const isFreeze = flippedDelta <= padding2

  const width = isNormal ? scale * shape.width : isFreeze ? 0 : flipScale * shape.width
  const height = isNormal ? scale * shape.height : isFreeze ? 0 : flipScale * shape.height

  const widthSign = isNormal ? 1 : isFreeze ? 1 : -1
  const heightSign = isNormal ? 1 : isFreeze ? 1 : -1

  const nextCenterX = bottomRightX + (width / 2) * widthSign * axisX.x - (height / 2) * heightSign * axisY.x
  const nextCenterY = bottomRightY + (width / 2) * widthSign * axisX.y - (height / 2) * heightSign * axisY.y

  const nextX = nextCenterX - width / 2
  const nextY = nextCenterY - height / 2

  const scaleX = shape.width === 0 ? 1 : width / shape.width
  const scaleY = shape.height === 0 ? 1 : height / shape.height

  const nextGeometry = (shape?.points ?? []).map((point) => {
    const localX = widthSign === 1
      ? point.x - shape.x
      : shape.width - (point.x - shape.x)
    const localY = heightSign === 1
      ? point.y - shape.y
      : shape.height - (point.y - shape.y)

    return {
      x: nextX + localX * scaleX,
      y: nextY + localY * scaleY,
    }
  })

  return {
    width,
    height,
    x: nextX,
    y: nextY,
    points: nextGeometry,
  }
}

const calcShapeBottomRightCornerAspectResizePatch: CalcShapeAspectResizePatch = ({ shape, cursor }) => {
  const angle = shape.rotate

  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const axisX = { x: cos, y: sin }
  const axisY = { x: -sin, y: cos }

  const leftX = centerX - (shape.width / 2) * cos
  const leftY = centerY - (shape.width / 2) * sin

  const topLeftX = leftX - (shape.height / 2) * axisY.x
  const topLeftY = leftY - (shape.height / 2) * axisY.y

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const diagonalX = shape.width * axisX.x + shape.height * axisY.x
  const diagonalY = shape.width * axisX.y + shape.height * axisY.y

  const originalLength = Math.sqrt(diagonalX ** 2 + diagonalY ** 2) || 1

  const cursorVecX = correctedCursorX - topLeftX
  const cursorVecY = correctedCursorY - topLeftY

  const projLength = (cursorVecX * diagonalX + cursorVecY * diagonalY) / originalLength

  const scale = projLength / originalLength

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  const flippedDelta = -projLength
  const flipLength = flippedDelta - padding2
  const flipScale = flipLength / originalLength

  const isNormal = scale > 0
  const isFreeze = flippedDelta <= padding2

  const width = isNormal ? scale * shape.width : isFreeze ? 0 : flipScale * shape.width
  const height = isNormal ? scale * shape.height : isFreeze ? 0 : flipScale * shape.height

  const widthSign = isNormal ? 1 : isFreeze ? 1 : -1
  const heightSign = isNormal ? 1 : isFreeze ? 1 : -1

  const nextCenterX = topLeftX + (width / 2) * widthSign * axisX.x + (height / 2) * heightSign * axisY.x
  const nextCenterY = topLeftY + (width / 2) * widthSign * axisX.y + (height / 2) * heightSign * axisY.y

  const nextX = nextCenterX - width / 2
  const nextY = nextCenterY - height / 2

  const scaleX = shape.width === 0 ? 1 : width / shape.width
  const scaleY = shape.height === 0 ? 1 : height / shape.height

  const nextGeometry = (shape?.points ?? []).map((point) => {
    const localX = widthSign === 1
      ? point.x - shape.x
      : shape.width - (point.x - shape.x)

    const localY = heightSign === 1
      ? point.y - shape.y
      : shape.height - (point.y - shape.y)

    return {
      x: nextX + localX * scaleX,
      y: nextY + localY * scaleY,
    }
  })

  return {
    width,
    height,
    x: nextX,
    y: nextY,
    points: nextGeometry,
  }
}


export const proportionalResizeFromCorner = {
  bottomRight: calcShapeBottomRightCornerAspectResizePatch,
  bottomLeft: calcShapeBottomLeftCornerAspectResizePatch,
  topRight: calcShapeTopRightCornerAspectResizePatch,
  topLeft: calcShapeTopLeftCornerAspectResizePatch,
}
