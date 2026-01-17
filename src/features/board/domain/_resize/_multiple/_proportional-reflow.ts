import { SELECTION_BOUNDS_PADDING } from "@/features/board/ui/selection-bounds-area"
import { mapSelectedShapes, type ResizeMultipleFromEdgeParams } from "../_shared"

export const reflowFromRightEdge = ({ selectionArea, shapes, cursor }: ResizeMultipleFromEdgeParams) => {
  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING

  const left = selectionArea.x
  const top = selectionArea.y

  const scale = (cursorX - left) / selectionArea.width

  return mapSelectedShapes(shapes, (shape) => {
    const centerHeight = shape.height / 2
    const centerWidth = shape.width / 2

    const shapeCenterX = shape.x + centerWidth
    const shapeCenterY = shape.y + centerHeight

    const t = (shapeCenterX - left) / selectionArea.width
    const easedT = Math.max(0, Math.min(1, t))

    const nextCenterX = left + easedT * selectionArea.width * scale
    const nextCenterY = top + (shapeCenterY - top) * scale

    return {
      ...shape,
      x: nextCenterX - centerWidth,
      y: nextCenterY - centerHeight,
    }
  })
}

export const reflowFromLeftEdge = ({ selectionArea, shapes, cursor }: ResizeMultipleFromEdgeParams) => {
  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING

  const left = selectionArea.x
  const top = selectionArea.y
  const right = left + selectionArea.width
  const bottom = top + selectionArea.height

  const scale = (cursorX - right) / selectionArea.width

  return mapSelectedShapes(shapes, (shape) => {
    const centerHeight = shape.height / 2
    const centerWidth = shape.width / 2

    const shapeCenterX = shape.x + centerWidth
    const shapeCenterY = shape.y + centerHeight

    const t = (right - shapeCenterX) / selectionArea.width
    const easedT = Math.max(0, Math.min(1, t))

    const nextCenterX = right + easedT * selectionArea.width * scale
    const nextCenterY = bottom + (bottom - shapeCenterY) * scale

    return {
      ...shape,
      x: nextCenterX - centerWidth,
      y: nextCenterY - centerHeight,
    }
  })
}

export const reflowFromTopEdge = ({ selectionArea, shapes, cursor }: ResizeMultipleFromEdgeParams) => {
  const cursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const left = selectionArea.x
  const top = selectionArea.y
  const right = left + selectionArea.width
  const bottom = top + selectionArea.height

  const scale = (cursorY - bottom) / selectionArea.height

  return mapSelectedShapes(shapes, (shape) => {
    const centerHeight = shape.height / 2
    const centerWidth = shape.width / 2

    const shapeCenterX = shape.x + centerWidth
    const shapeCenterY = shape.y + centerHeight

    const t = (bottom - shapeCenterY) / selectionArea.height
    const easedT = Math.max(0, Math.min(1, t))

    const nextCenterX = right + (right - shapeCenterX) * scale
    const nextCenterY = bottom + easedT * selectionArea.height * scale

    return {
      ...shape,
      x: nextCenterX - centerWidth,
      y: nextCenterY - centerHeight,
    }
  })
}

export const reflowFromBottomEdge = ({
  selectionArea,
  shapes,
  cursor,
}: ResizeMultipleFromEdgeParams) => {
  const cursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const left = selectionArea.x
  const top = selectionArea.y

  const scale = (cursorY - top) / selectionArea.height

  return mapSelectedShapes(shapes, (shape) => {
    const centerWidth = shape.width / 2
    const centerHeight = shape.height / 2

    const shapeCenterX = shape.x + centerWidth
    const shapeCenterY = shape.y + centerHeight

    const t = (shapeCenterY - top) / selectionArea.height
    const easedT = Math.max(0, Math.min(1, t))

    const nextCenterX = left + (shapeCenterX - left) * scale
    const nextCenterY = top + easedT * selectionArea.height * scale

    return {
      ...shape,
      x: nextCenterX - centerWidth,
      y: nextCenterY - centerHeight,
    }
  })
}
