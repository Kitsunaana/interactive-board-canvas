import type { ShapeToView } from "../../shape"
import type { ResizeMultipleFromBoundParams } from "../_shared"
import { mapSelectedShapes, SELECTION_BOUNDS_PADDING } from "../_shared"

const reflowFromLeftBound = ({ selectionArea, shapes, cursor }: ResizeMultipleFromBoundParams) => {
  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const left = selectionArea.x
  const right = left + selectionArea.width
  const delta = cursorX - left

  const toReflowShapes = new Map<string, Partial<ShapeToView>>()

  mapSelectedShapes(shapes, (shape) => {
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

const reflowFromTopBound = ({ shapes, cursor, selectionArea }: ResizeMultipleFromBoundParams) => {
  const cursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const delta = cursorY - top

  const toReflowShapes = new Map<string, Partial<ShapeToView>>()

  mapSelectedShapes(shapes, (shape) => {
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

const reflowFromBottomBound = ({ shapes, cursor, selectionArea }: ResizeMultipleFromBoundParams) => {
  const cursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const delta = cursorY - bottom

  const toReflowShapes = new Map<string, Partial<ShapeToView>>()

  mapSelectedShapes(shapes, (shape) => {
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

const reflowFromRightBound = ({ selectionArea, shapes, cursor }: ResizeMultipleFromBoundParams) => {
  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING

  const left = selectionArea.x
  const right = left + selectionArea.width
  const delta = cursorX - right

  const toReflowShapes = new Map<string, Partial<ShapeToView>>()

  mapSelectedShapes(shapes, (shape) => {
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

export const reflowFromBottomRightCorner = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const reflowYAxisShapes = reflowFromBottomBound({ cursor, shapes, selectionArea })
  const reflowXAxisShapes = reflowFromRightBound({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => {
    return {
      ...shape,
      ...reflowYAxisShapes.get(shape.id),
      ...reflowXAxisShapes.get(shape.id),
    }
  })
}

export const reflowFromBottomLeftCorner = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const reflowYAxisShapes = reflowFromBottomBound({ cursor, shapes, selectionArea })
  const reflowXAxisShapes = reflowFromLeftBound({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => {
    return {
      ...shape,
      ...reflowYAxisShapes.get(shape.id),
      ...reflowXAxisShapes.get(shape.id),
    }
  })
}

export const reflowFromTopRightCorner = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const reflowYAxisShapes = reflowFromTopBound({ cursor, shapes, selectionArea })
  const reflowXAxisShapes = reflowFromRightBound({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => {
    return {
      ...shape,
      ...reflowYAxisShapes.get(shape.id),
      ...reflowXAxisShapes.get(shape.id),
    }
  })
}

export const reflowFromTopLeftCorner = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const reflowYAxisShapes = reflowFromTopBound({ cursor, shapes, selectionArea })
  const reflowXAxisShapes = reflowFromLeftBound({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => {
    return {
      ...shape,
      ...reflowYAxisShapes.get(shape.id),
      ...reflowXAxisShapes.get(shape.id),
    }
  })
}