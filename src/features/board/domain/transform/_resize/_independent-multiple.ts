import type { Rect } from "@/shared/type/shared"
import { forEach } from "lodash"
import type { ResizeMultipleFromBoundParams } from "../_types"
import { SELECTION_BOUNDS_PADDING } from "../_types"

export const calcSelectionTopBoundResizePatches = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const top = selectionArea.y
  const bottom = top + selectionArea.height

  const cursorPositionY = cursor.y + SELECTION_BOUNDS_PADDING
  const delta = top - cursorPositionY

  const prevHeight = selectionArea.height
  const nextHeight = prevHeight + delta
  const scale = nextHeight / prevHeight

  const toTransformShapes = new Map<string, Partial<Rect>>()

  if (nextHeight <= 0) {
    const delta = cursorPositionY - bottom
    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2
    const scale = nextHeight / prevHeight

    if (nextHeight <= 0) {
      forEach(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          height: 0,
          y: bottom,
        })
      })

      return toTransformShapes
    }

    forEach(shapes, (shape) => {
      toTransformShapes.set(shape.id, {
        height: shape.height * scale,
        y: bottom + (shape.y - top) * scale,
      })
    })

    return toTransformShapes
  }

  forEach(shapes, (shape) => {
    toTransformShapes.set(shape.id, {
      height: shape.height * scale,
      y: bottom + (shape.y - bottom) * scale,
    })
  })

  return toTransformShapes
}

export const calcSelectionLeftBoundResizePatches = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const left = selectionArea.x
  const right = left + selectionArea.width

  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const delta = left - cursorX

  const prevWidth = selectionArea.width
  const nextWidth = prevWidth + delta
  const scale = nextWidth / prevWidth

  const toTransformShapes = new Map<string, Partial<Rect>>()

  if (nextWidth <= 0) {
    const delta = cursorX - right
    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2
    const scale = nextWidth / prevWidth

    if (nextWidth <= 0) {
      forEach(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          width: 0,
          x: right,
        })
      })

      return toTransformShapes
    }

    forEach(shapes, (shape) => {
      toTransformShapes.set(shape.id, {
        width: shape.width * scale,
        x: right + (shape.x - left) * scale,
      })
    })

    return toTransformShapes
  }

  forEach(shapes, (shape) => {
    toTransformShapes.set(shape.id, {
      width: shape.width * scale,
      x: right + (shape.x - right) * scale,
    })
  })

  return toTransformShapes
}

export const calcSelectionBottomBoundResizePatches = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const top = selectionArea.y
  const bottom = top + selectionArea.height

  const cursorPositionY = cursor.y - SELECTION_BOUNDS_PADDING
  const delta = cursorPositionY - bottom

  const prevHeight = selectionArea.height
  const nextHeight = prevHeight + delta

  const scale = nextHeight / prevHeight

  const toTransformShapes = new Map<string, Partial<Rect>>()

  if (nextHeight <= 0) {
    const delta = top - cursorPositionY
    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2
    const scale = nextHeight / prevHeight

    if (nextHeight <= 0) {
      forEach(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          y: top,
          height: 0,
        })
      })

      return toTransformShapes
    }

    forEach(shapes, (shape) => {
      toTransformShapes.set(shape.id, {
        height: shape.height * scale,
        y: top + (shape.y - bottom) * scale,
      })
    })

    return toTransformShapes
  }

  forEach(shapes, (shape) => {
    toTransformShapes.set(shape.id, {
      height: shape.height * scale,
      y: top + (shape.y - top) * scale,
    })
  })

  return toTransformShapes
}

export const calcSelectionRightBoundResizePatches = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const left = selectionArea.x
  const right = left + selectionArea.width

  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const delta = cursorX - right

  const prevWidth = selectionArea.width
  const nextWidth = prevWidth + delta
  const scale = nextWidth / prevWidth

  const toTransformShapes = new Map<string, Partial<Rect>>()

  if (nextWidth <= 0) {
    const delta = left - cursorX
    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2
    const scale = nextWidth / prevWidth

    if (nextWidth <= 0) {
      forEach(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          width: 0,
          x: left,
        })
      })

      return toTransformShapes
    }

    forEach(shapes, (shape) => {
      toTransformShapes.set(shape.id, {
        width: shape.width * scale,
        x: left + (shape.x - right) * scale,
      })
    })

    return toTransformShapes
  }

  forEach(shapes, (shape) => {
    toTransformShapes.set(shape.id, {
      width: shape.width * scale,
      x: left + (shape.x - left) * scale,
    })
  })

  return toTransformShapes
}
