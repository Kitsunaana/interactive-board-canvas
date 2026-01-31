import type { Point, Rect } from "@/shared/type/shared";
import { SELECTION_BOUNDS_PADDING } from "../../../transform/_const";

type CalcShapeResizePatch = (params: { points: Point[], bbox: Rect, angle: number, cursor: Point }) => Point[];

export const calcShapeRightBoundResizePatch: CalcShapeResizePatch = ({ bbox, angle, cursor, points }) => {
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const leftX = centerX - (bbox.width / 2) * cos
  const leftY = centerY - (bbox.width / 2) * sin

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
    const nextY = nextCenterY - (bbox.height / 2)

    const scaleX = nextWidth / bbox.width

    return points.map((point) => ({
      x: nextX + (point.x - bbox.x) * scaleX,
      y: nextY + (point.y - bbox.y),
    }))
  }

  const delta = leftX - correctedCursorX

  if (delta <= SELECTION_BOUNDS_PADDING * 2) {
    const nextX = leftX
    const nextY = leftY - (bbox.height / 2)

    return points.map((point) => ({
      x: nextX + (point.x - bbox.x) * 0,
      y: nextY + (point.y - bbox.y),
    }))
  }

  const flipWidth = delta - SELECTION_BOUNDS_PADDING * 2

  const nextLeftX = leftX - axisX.x * flipWidth
  const nextLeftY = leftY - axisX.y * flipWidth

  const nextCenterX = (nextLeftX + leftX) / 2
  const nextCenterY = (nextLeftY + leftY) / 2

  const nextX = nextCenterX - (flipWidth / 2)
  const nextY = nextCenterY - (bbox.height / 2)

  const scaleX = flipWidth / bbox.width

  return points.map((point) => {
    const localX = point.x - bbox.x
    const flippedLocalX = bbox.width - localX
    const scaledLocalX = flippedLocalX * scaleX

    return {
      x: nextX + scaledLocalX,
      y: nextY + (point.y - bbox.y),
    }
  })
};

export const calcShapeLeftBoundResizePatch: CalcShapeResizePatch = ({ bbox, angle, cursor, points }) => {
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const rightX = centerX + (bbox.width / 2) * cos
  const rightY = centerY + (bbox.width / 2) * sin

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const correctedCursorY = cursor.y

  const toCursorX = rightX - correctedCursorX
  const toCursorY = rightY - correctedCursorY

  const axisX = { x: cos, y: sin }

  const dot = toCursorX * axisX.x + toCursorY * axisX.y
  const axisLength = Math.sqrt(axisX.x * axisX.x + axisX.y * axisX.y)
  const projection = dot / axisLength

  const nextWidth = projection

  if (nextWidth > 0) {
    const nextCenterX = rightX - (nextWidth / 2) * axisX.x
    const nextCenterY = rightY - (nextWidth / 2) * axisX.y

    const nextX = nextCenterX - (nextWidth / 2)
    const nextY = nextCenterY - (bbox.height / 2)

    const scaleX = nextWidth / bbox.width

    return points.map((point) => ({
      x: nextX + (point.x - bbox.x) * scaleX,
      y: nextY + (point.y - bbox.y),
    }))
  }

  const delta = correctedCursorX - rightX

  if (delta <= SELECTION_BOUNDS_PADDING * 2) {
    const nextX = rightX
    const nextY = rightY - (bbox.height / 2)

    return points.map((point) => ({
      x: nextX + (point.x - bbox.x) * 0,
      y: nextY + (point.y - bbox.y),
    }))
  }

  const dirAxisX = { x: -cos, y: -sin }

  const flipWidth = delta - SELECTION_BOUNDS_PADDING * 2

  const nextRightX = rightX - dirAxisX.x * flipWidth
  const nextRightY = rightY - dirAxisX.y * flipWidth

  const nextCenterX = (nextRightX + rightX) / 2
  const nextCenterY = (nextRightY + rightY) / 2

  const nextX = nextCenterX - (flipWidth / 2)
  const nextY = nextCenterY - (bbox.height / 2)

  const scaleX = flipWidth / bbox.width

  return points.map((point) => {
    const localX = point.x - bbox.x
    const flippedLocalX = bbox.width - localX
    const scaledLocalX = flippedLocalX * scaleX

    return {
      x: nextX + scaledLocalX,
      y: nextY + (point.y - bbox.y),
    }
  })
};

export const calcShapeTopBoundResizePatch: CalcShapeResizePatch = ({ bbox, angle, cursor, points }) => {
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const bottomX = centerX - (bbox.height / 2) * sin
  const bottomY = centerY + (bbox.height / 2) * cos

  const correctedCursorX = cursor.x
  const correctedCursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const toCursorX = bottomX - correctedCursorX
  const toCursorY = bottomY - correctedCursorY

  const axisY = { x: -sin, y: cos }

  const dot = toCursorX * axisY.x + toCursorY * axisY.y
  const axisLength = Math.sqrt(axisY.x * axisY.x + axisY.y * axisY.y)
  const projection = dot / axisLength

  const nextHeight = projection

  if (nextHeight > 0) {
    const nextCenterX = bottomX - (nextHeight / 2) * axisY.x
    const nextCenterY = bottomY - (nextHeight / 2) * axisY.y

    const nextX = nextCenterX - (bbox.width / 2)
    const nextY = nextCenterY - (nextHeight / 2)

    const scaleY = nextHeight / bbox.height

    return points.map((point) => ({
      x: nextX + (point.x - bbox.x),
      y: nextY + (point.y - bbox.y) * scaleY,
    }))
  }

  const delta = correctedCursorY - bottomY

  if (delta <= SELECTION_BOUNDS_PADDING * 2) {
    const nextX = bottomX - (bbox.width / 2)
    const nextY = bottomY

    return points.map((point) => ({
      x: nextX + (point.x - bbox.x),
      y: nextY + (point.y - bbox.y) * 0,
    }))
  }

  const flipHeight = delta - SELECTION_BOUNDS_PADDING * 2

  const nextBottomX = bottomX + axisY.x * flipHeight
  const nextBottomY = bottomY + axisY.y * flipHeight

  const nextCenterX = (nextBottomX + bottomX) / 2
  const nextCenterY = (nextBottomY + bottomY) / 2

  const nextX = nextCenterX - (bbox.width / 2)
  const nextY = nextCenterY - (flipHeight / 2)

  const scaleY = flipHeight / bbox.height

  return points.map((point) => {
    const localY = point.y - bbox.y
    const flippedLocalY = bbox.height - localY
    const scaledLocalY = flippedLocalY * scaleY

    return {
      x: nextX + (point.x - bbox.x),
      y: nextY + scaledLocalY,
    }
  })
};

export const calcShapeBottomBoundResizePatch: CalcShapeResizePatch = ({ bbox, angle, cursor, points }) => {
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const topX = centerX + (bbox.height / 2) * sin
  const topY = centerY - (bbox.height / 2) * cos

  const correctedCursorX = cursor.x
  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const toCursorX = topX - correctedCursorX
  const toCursorY = topY - correctedCursorY

  const axisY = { x: sin, y: -cos }

  const dot = toCursorX * axisY.x + toCursorY * axisY.y
  const axisLength = Math.sqrt(axisY.x * axisY.x + axisY.y * axisY.y)
  const projection = dot / axisLength

  const nextHeight = projection

  if (nextHeight > 0) {
    const nextCenterX = topX - (nextHeight / 2) * axisY.x
    const nextCenterY = topY - (nextHeight / 2) * axisY.y

    const nextX = nextCenterX - (bbox.width / 2)
    const nextY = nextCenterY - (nextHeight / 2)

    const scaleY = nextHeight / bbox.height

    const nextGeometry = points.map((point) => ({
      x: nextX + (point.x - bbox.x),
      y: nextY + (point.y - bbox.y) * scaleY,
    }))

    return nextGeometry
  }

  const delta = topY - correctedCursorY

  if (delta <= SELECTION_BOUNDS_PADDING * 2) {
    const nextX = topX - (bbox.width / 2)
    const nextY = topY

    const nextGeometry = points.map((point) => ({
      x: nextX + (point.x - bbox.x),
      y: nextY + (point.y - bbox.y) * 0,
    }))

    return nextGeometry
  }

  const flipHeight = delta - SELECTION_BOUNDS_PADDING * 2

  const nextTopX = topX + axisY.x * flipHeight
  const nextTopY = topY + axisY.y * flipHeight

  const nextCenterX = (nextTopX + topX) / 2
  const nextCenterY = (nextTopY + topY) / 2

  const nextX = nextCenterX - (bbox.width / 2)
  const nextY = nextCenterY - (flipHeight / 2)

  const scaleY = flipHeight / bbox.height

  const nextGeometry = points.map((point) => {
    const localY = point.y - bbox.y
    const flippedLocalY = bbox.height - localY
    const scaledLocalY = flippedLocalY * scaleY

    return {
      x: nextX + (point.x - bbox.x),
      y: nextY + scaledLocalY,
    }
  })

  return nextGeometry
}
