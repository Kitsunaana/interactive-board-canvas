import type { ShapeToView } from "../../shape"
import type { ResizeMultipleFromBoundParams } from "../_shared"
import { mapSelectedShapes, SELECTION_BOUNDS_PADDING } from "../_shared"

export const topWithFlipToBottom = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const top = selectionArea.y
  const bottom = top + selectionArea.height

  const cursorPositionY = cursor.y + SELECTION_BOUNDS_PADDING
  const delta = top - cursorPositionY

  const prevHeight = selectionArea.height
  const nextHeight = prevHeight + delta
  const scale = nextHeight / prevHeight

  const toTransformShapes = new Map<string, Partial<ShapeToView>>()

  mapSelectedShapes(shapes, (shape) => {
    toTransformShapes.set(shape.id, {
      height: shape.height * scale,
      y: bottom + (shape.y - bottom) * scale,
    })
  })

  if (nextHeight <= 0) {
    const delta = cursorPositionY - bottom
    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2
    const scale = nextHeight / prevHeight

    if (nextHeight <= 0) {
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          height: 0,
          y: bottom,
        })
      })
    }

    if (nextHeight > 0) {
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          height: shape.height * scale,
          y: bottom + (shape.y - top) * scale,
        })
      })
    }
  }

  return toTransformShapes
}

export const leftWithFlipToRight = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const left = selectionArea.x
  const right = left + selectionArea.width

  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const delta = left - cursorX

  const prevWidth = selectionArea.width
  const nextWidth = prevWidth + delta
  const scale = nextWidth / prevWidth

  const toTransformShapes = new Map<string, Partial<ShapeToView>>()

  mapSelectedShapes(shapes, (shape) => {
    toTransformShapes.set(shape.id, {
      width: shape.width * scale,
      x: right + (shape.x - right) * scale,
    })
  })

  if (nextWidth <= 0) {
    const delta = cursorX - right
    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2
    const scale = nextWidth / prevWidth

    if (nextWidth <= 0) {
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          width: 0,
          x: right,
        })
      })
    }

    if (nextWidth > 0) {
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          width: shape.width * scale,
          x: right + (shape.x - left) * scale,
        })
      })
    }
  }

  return toTransformShapes
}

export const bottomWithFlipToTop = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const top = selectionArea.y
  const bottom = top + selectionArea.height

  const cursorPositionY = cursor.y - SELECTION_BOUNDS_PADDING
  const delta = cursorPositionY - bottom

  const prevHeight = selectionArea.height
  const nextHeight = prevHeight + delta

  const scale = nextHeight / prevHeight

  const toTransformShapes = new Map<string, Partial<ShapeToView>>()

  mapSelectedShapes(shapes, (shape) => {
    toTransformShapes.set(shape.id, {
      height: shape.height * scale,
      y: top + (shape.y - top) * scale,
    })
  })

  if (nextHeight <= 0) {
    const delta = top - cursorPositionY
    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2
    const scale = nextHeight / prevHeight

    if (nextHeight <= 0) {
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          y: top,
          height: 0,
        })
      })
    }

    if (nextHeight > 0) {
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          height: shape.height * scale,
          y: top + (shape.y - bottom) * scale,
        })
      })
    }
  }

  return toTransformShapes
}

export const rightWithFlipToLeft = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const left = selectionArea.x
  const right = left + selectionArea.width

  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const delta = cursorX - right

  const prevWidth = selectionArea.width
  const nextWidth = prevWidth + delta
  const scale = nextWidth / prevWidth

  const toTransformShapes = new Map<string, Partial<ShapeToView>>()

  mapSelectedShapes(shapes, (shape) => {
    toTransformShapes.set(shape.id, {
      width: shape.width * scale,
      x: left + (shape.x - left) * scale,
    })
  })

  if (nextWidth <= 0) {
    const delta = left - cursorX
    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2
    const scale = nextWidth / prevWidth

    if (nextWidth <= 0) {
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          width: 0,
          x: left,
        })
      })
    }

    if (nextWidth > 0) {
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          width: shape.width * scale,
          x: left + (shape.x - right) * scale,
        })
      })
    }
  }

  return toTransformShapes
}



export const resizeFromLeftBound = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const resizeXAxisShapes = leftWithFlipToRight({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...resizeXAxisShapes.get(shape.id),
  }))
}

export const resizeFromRightBound = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const resizeXAxisShapes = rightWithFlipToLeft({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...resizeXAxisShapes.get(shape.id),
  }))
}

export const resizeFromTopBound = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const resizeYAxisShapes = topWithFlipToBottom({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...resizeYAxisShapes.get(shape.id),
  }))
}

export const resizeFromBottomBound = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const resizeYAxisShapes = bottomWithFlipToTop({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...resizeYAxisShapes.get(shape.id),
  }))
}