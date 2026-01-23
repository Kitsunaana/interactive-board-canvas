import type { Rect } from "@/shared/type/shared"
import { forEach } from "lodash"
import { SELECTION_BOUNDS_PADDING, type CalcSelectionReflowPatches } from "../_types"

export const calcSelectionRightBoundReflowPatches: CalcSelectionReflowPatches = ({ selectionArea, shapes, cursor }) => {
  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING

  const left = selectionArea.x

  const centerY = selectionArea.y + selectionArea.height / 2
  const scale = (cursorX - left) / selectionArea.width

  const toReflowShapes = new Map<string, Partial<Rect>>()

  forEach(shapes, (shape) => {
    const centerHeight = shape.height / 2
    const centerWidth = shape.width / 2

    const shapeCenterX = shape.x + centerWidth
    const shapeCenterY = shape.y + centerHeight

    const t = (shapeCenterX - left) / selectionArea.width
    const easedT = Math.max(0, Math.min(1, t))

    const nextCenterX = left + easedT * selectionArea.width * scale
    const nextCenterY = centerY + (shapeCenterY - centerY) * scale

    toReflowShapes.set(shape.id, {
      x: nextCenterX - centerWidth,
      y: nextCenterY - centerHeight,
    })
  })

  return toReflowShapes
}

export const calcSelectionLeftBoundReflowPatches: CalcSelectionReflowPatches = ({ selectionArea, shapes, cursor }) => {
  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING

  const left = selectionArea.x
  const right = left + selectionArea.width

  const centerY = selectionArea.y + selectionArea.height / 2
  const scale = (cursorX - right) / selectionArea.width

  const toReflowShapes = new Map<string, Partial<Rect>>()

  forEach(shapes, (shape) => {
    const centerHeight = shape.height / 2
    const centerWidth = shape.width / 2

    const shapeCenterX = shape.x + centerWidth
    const shapeCenterY = shape.y + centerHeight

    const t = (right - shapeCenterX) / selectionArea.width
    const easedT = Math.max(0, Math.min(1, t))

    const nextCenterX = right + easedT * selectionArea.width * scale
    const nextCenterY = centerY + (centerY - shapeCenterY) * scale

    toReflowShapes.set(shape.id, {
      x: nextCenterX - centerWidth,
      y: nextCenterY - centerHeight,
    })
  })

  return toReflowShapes
}

export const calcSelectionTopBoundReflowPatches: CalcSelectionReflowPatches = ({ selectionArea, shapes, cursor }) => {
  const cursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const left = selectionArea.x
  const top = selectionArea.y
  const bottom = top + selectionArea.height

  const centerX = left + selectionArea.width / 2
  const scale = (cursorY - bottom) / selectionArea.height

  const toReflowShapes = new Map<string, Partial<Rect>>()

  forEach(shapes, (shape) => {
    const centerHeight = shape.height / 2
    const centerWidth = shape.width / 2

    const shapeCenterX = shape.x + centerWidth
    const shapeCenterY = shape.y + centerHeight

    const t = (bottom - shapeCenterY) / selectionArea.height
    const easedT = Math.max(0, Math.min(1, t))

    const nextCenterX = centerX + (centerX - shapeCenterX) * scale
    const nextCenterY = bottom + easedT * selectionArea.height * scale

    toReflowShapes.set(shape.id, {
      x: nextCenterX - centerWidth,
      y: nextCenterY - centerHeight,
    })
  })

  return toReflowShapes
}

export const calcSelectionBottomBoundReflowPatches: CalcSelectionReflowPatches = ({ selectionArea, shapes, cursor }) => {
  const cursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const top = selectionArea.y

  const centerX = selectionArea.x + selectionArea.width / 2
  const scale = (cursorY - top) / selectionArea.height

  const toReflowShapes = new Map<string, Partial<Rect>>()

  forEach(shapes, (shape) => {
    const centerWidth = shape.width / 2
    const centerHeight = shape.height / 2

    const shapeCenterX = shape.x + centerWidth
    const shapeCenterY = shape.y + centerHeight

    const t = (shapeCenterY - top) / selectionArea.height
    const easedT = Math.max(0, Math.min(1, t))

    const nextCenterX = centerX + (shapeCenterX - centerX) * scale
    const nextCenterY = top + easedT * selectionArea.height * scale

    toReflowShapes.set(shape.id, {
      x: nextCenterX - centerWidth,
      y: nextCenterY - centerHeight,
    })
  })

  return toReflowShapes
}

export const Short = {
  bottom: calcSelectionBottomBoundReflowPatches,
  right: calcSelectionRightBoundReflowPatches,
  left: calcSelectionLeftBoundReflowPatches,
  top: calcSelectionTopBoundReflowPatches,
}