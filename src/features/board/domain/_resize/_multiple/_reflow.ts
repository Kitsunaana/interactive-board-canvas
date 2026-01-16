import { PADDING } from "@/features/board/view-model/sticker"
import { mapSelectedShapes, type ResizeMultipleFromEdgeParams } from "../_shared"

const reflowFromLeftEdge = ({ selectionArea, shapes, cursor }: ResizeMultipleFromEdgeParams) => {
  const cursorX = cursor.x + PADDING

  const left = selectionArea.x
  const right = left + selectionArea.width
  const delta = cursorX - left

  return mapSelectedShapes(shapes, (shape) => {
    const shapeLeft = shape.x
    const shapeCenter = shapeLeft + shape.width / 2

    const t = (right - shapeCenter) / selectionArea.width
    const easedT = Math.max(0, Math.min(1, t))

    return {
      ...shape,
      x: shapeLeft + easedT * delta,
    }
  })
}


const reflowFromRightEdge = ({ selectionArea, shapes, cursor }: ResizeMultipleFromEdgeParams) => {
  const cursorX = cursor.x - PADDING

  const left = selectionArea.x
  const right = left + selectionArea.width
  const delta = cursorX - right

  return mapSelectedShapes(shapes, (shape) => {
    const shapeLeft = shape.x
    const shapeCenter = shapeLeft + shape.width / 2

    const t = (shapeCenter - left) / selectionArea.width
    const easedT = Math.max(0, Math.min(1, t))

    return {
      ...shape,
      x: shapeLeft + easedT * delta,
    }
  })
}

const reflowFromTopEdge = ({ shapes, cursor, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const cursorY = cursor.y + PADDING

  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const delta = cursorY - top

  return mapSelectedShapes(shapes, (shape) => {
    const shapeTop = shape.y
    const shapeCenter = shapeTop + shape.height / 2

    const t = (bottom - shapeCenter) / selectionArea.height
    const easedT = Math.max(0, Math.min(1, t))

    return {
      ...shape,
      y: shapeTop + easedT * delta,
    }
  })
}

const reflowFromBottomEdge = ({ shapes, cursor, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const cursorY = cursor.y - PADDING

  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const delta = cursorY - bottom

  return mapSelectedShapes(shapes, (shape) => {
    const shapeTop = shape.y
    const shapeCenter = shapeTop + shape.height / 2

    const t = (shapeCenter - top) / selectionArea.height
    const easedT = Math.max(0, Math.min(1, t))

    return {
      ...shape,
      y: shapeTop + easedT * delta,
    }
  })
}

export const reflow = {
  bottom: reflowFromBottomEdge,
  right: reflowFromRightEdge,
  left: reflowFromLeftEdge,
  top: reflowFromTopEdge
}