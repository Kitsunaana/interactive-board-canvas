import { forEach } from "lodash"
import type { ShapeToView } from "../../shape"
import { SELECTION_BOUNDS_PADDING, type CalcSelectionLeftResizeOffsets } from "../_types"

export const calcSelectionLeftResizeOffsets: CalcSelectionLeftResizeOffsets = ({ cursor, shapes, selectionArea }) => {
  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const left = selectionArea.x
  const right = left + selectionArea.width
  const delta = cursorX - left

  const toReflowShapes = new Map<string, Partial<ShapeToView>>()

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

export const calcSelectionTopResizeOffsets: CalcSelectionLeftResizeOffsets = ({ cursor, shapes, selectionArea }) => {
  const cursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const delta = cursorY - top

  const toReflowShapes = new Map<string, Partial<ShapeToView>>()

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

export const calcSelectionBottomResizeOffsets: CalcSelectionLeftResizeOffsets = ({ cursor, shapes, selectionArea }) => {
  const cursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const delta = cursorY - bottom

  const toReflowShapes = new Map<string, Partial<ShapeToView>>()

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

export const calcSelectionRightResizeOffsets: CalcSelectionLeftResizeOffsets = ({ cursor, shapes, selectionArea }) => {
  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING

  const left = selectionArea.x
  const right = left + selectionArea.width
  const delta = cursorX - right

  const toReflowShapes = new Map<string, Partial<ShapeToView>>()

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