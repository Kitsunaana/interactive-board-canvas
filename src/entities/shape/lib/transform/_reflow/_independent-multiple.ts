import type { Point, Rect, RectWithId } from "@/shared/type/shared"
import { forEach } from "lodash"
import { SELECTION_BOUNDS_PADDING } from "../_const"

export type CalcSelectionResizeOffsetsParams = {
  selectionArea: Rect
  shapes: RectWithId[]
  cursor: Point
}

export type CalcSelectionResizeOffsets = (params: CalcSelectionResizeOffsetsParams) => Map<string, Partial<Rect>>

export const calcSelectionLeftResizeOffsets: CalcSelectionResizeOffsets = ({ cursor, shapes, selectionArea }) => {
  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING

  const left = selectionArea.x
  const right = left + selectionArea.width

  const delta = cursorX - left

  const toReflowShapes = new Map<string, Partial<Rect>>()

  forEach(shapes, (shape) => {
    const shapeLeft = shape.x
    const shapeCenter = shapeLeft + shape.width / 2

    const t = (right - shapeCenter) / selectionArea.width
    const easedT = Math.max(0, Math.min(1, t))

    toReflowShapes.set(shape.id, {
      x: shapeLeft + easedT * delta,
    })
  })

  return toReflowShapes
}

export const calcSelectionTopResizeOffsets: CalcSelectionResizeOffsets = ({ cursor, shapes, selectionArea }) => {
  const cursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const top = selectionArea.y
  const bottom = top + selectionArea.height

  const delta = cursorY - top

  const toReflowShapes = new Map<string, Partial<Rect>>()

  forEach(shapes, (shape) => {
    const shapeTop = shape.y
    const shapeCenter = shapeTop + shape.height / 2

    const t = (bottom - shapeCenter) / selectionArea.height
    const easedT = Math.max(0, Math.min(1, t))

    toReflowShapes.set(shape.id, {
      y: shapeTop + easedT * delta,
    })
  })

  return toReflowShapes
}

export const calcSelectionBottomResizeOffsets: CalcSelectionResizeOffsets = ({ cursor, shapes, selectionArea }) => {
  const cursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const top = selectionArea.y
  const bottom = top + selectionArea.height

  const delta = cursorY - bottom

  const toReflowShapes = new Map<string, Partial<Rect>>()

  forEach(shapes, (shape) => {
    const shapeTop = shape.y
    const shapeCenter = shapeTop + shape.height / 2

    const t = (shapeCenter - top) / selectionArea.height
    const easedT = Math.max(0, Math.min(1, t))

    toReflowShapes.set(shape.id, {
      y: shapeTop + easedT * delta,
    })
  })

  return toReflowShapes
}

export const calcSelectionRightResizeOffsets: CalcSelectionResizeOffsets = ({ cursor, shapes, selectionArea }) => {
  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING

  const left = selectionArea.x
  const right = left + selectionArea.width

  const delta = cursorX - right

  const toReflowShapes = new Map<string, Partial<Rect>>()

  forEach(shapes, (shape) => {
    const shapeLeft = shape.x
    const shapeCenter = shapeLeft + shape.width / 2

    const t = (shapeCenter - left) / selectionArea.width
    const easedT = Math.max(0, Math.min(1, t))

    toReflowShapes.set(shape.id, {
      x: shapeLeft + easedT * delta,
    })
  })

  return toReflowShapes
}

export const Short = {
  bottom: calcSelectionBottomResizeOffsets,
  right: calcSelectionRightResizeOffsets,
  left: calcSelectionLeftResizeOffsets,
  top: calcSelectionTopResizeOffsets,
}