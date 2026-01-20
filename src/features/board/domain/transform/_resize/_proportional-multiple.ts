import type { Rect } from "@/shared/type/shared"
import { defaultTo } from "lodash"
import type { RectBounds, ResizeMultipleFromBoundParams } from "../_types"
import { SELECTION_BOUNDS_PADDING, mapSelectedShapes } from "../_types"

export const calcSelectionRightBoundAspectResizePatches = ({ cursor, shapes, selectionArea, ...params }: ResizeMultipleFromBoundParams) => {
  const left = selectionArea.x
  const right = left + selectionArea.width
  const top = selectionArea.y
  const bottom = selectionArea.y + selectionArea.height

  const areaBounds: RectBounds = { bottom, right, left, top }

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
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          y: top,
          x: left,
          width: 0,
          height: 0,
          ...defaultTo(params.frizen?.(scale, shape, areaBounds), {})
        })
      })

      return toTransformShapes
    }

    mapSelectedShapes(shapes, (shape) => {
      const aspectRatio = shape.height / shape.width

      const nextWidth = shape.width * scale
      const nextHeight = nextWidth * aspectRatio

      toTransformShapes.set(shape.id, {
        width: nextWidth,
        height: nextHeight,
        y: top + (shape.y - bottom) * scale,
        x: left + (shape.x - right) * scale,
        ...defaultTo(params.flip?.(scale, shape, areaBounds), {})
      })
    })

    return toTransformShapes
  }

  mapSelectedShapes(shapes, (shape) => {
    const aspectRatio = shape.height / shape.width

    const nextWidth = shape.width * scale
    const nextHeight = nextWidth * aspectRatio

    toTransformShapes.set(shape.id, {
      width: nextWidth,
      height: nextHeight,
      y: top + (shape.y - top) * scale,
      x: left + (shape.x - left) * scale,
      ...defaultTo(params.default?.(scale, shape, areaBounds), {})
    })
  })

  return toTransformShapes
}

export const calcSelectionLeftBoundAspectResizePatches = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const left = selectionArea.x
  const right = left + selectionArea.width
  const top = selectionArea.y
  const bottom = top + selectionArea.height

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
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          y: top,
          x: right,
          width: 0,
          height: 0,
        })
      })

      return toTransformShapes
    }

    mapSelectedShapes(shapes, (shape) => {
      const aspectRatio = shape.height / shape.width

      const nextWidth = shape.width * scale
      const nextHeight = nextWidth * aspectRatio

      toTransformShapes.set(shape.id, {
        width: nextWidth,
        height: nextHeight,
        y: top + (shape.y - bottom) * scale,
        x: right + (shape.x - left) * scale,
      })
    })

    return toTransformShapes
  }

  mapSelectedShapes(shapes, (shape) => {
    const aspectRatio = shape.height / shape.width

    const nextWidth = shape.width * scale
    const nextHeight = nextWidth * aspectRatio

    toTransformShapes.set(shape.id, {
      width: nextWidth,
      height: nextHeight,
      y: top + (shape.y - top) * scale,
      x: right + (shape.x - right) * scale,
    })
  })

  return toTransformShapes
}

export const calcSelectionTopBoundAspectResizePatches = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const left = selectionArea.x
  const right = left + selectionArea.width

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
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          x: right,
          y: bottom,
          width: 0,
          height: 0,
        })
      })

      return toTransformShapes
    }

    mapSelectedShapes(shapes, (shape) => {
      const aspectRatio = shape.width / shape.height

      const nextHeight = shape.height * scale
      const nextWidth = nextHeight * aspectRatio

      toTransformShapes.set(shape.id, {
        width: nextWidth,
        height: nextHeight,
        y: bottom + (shape.y - top) * scale,
        x: right + (shape.x - left) * scale,
      })
    })

    return toTransformShapes
  }

  mapSelectedShapes(shapes, (shape) => {
    const aspectRatio = shape.width / shape.height

    const nextHeight = shape.height * scale
    const nextWidth = nextHeight * aspectRatio

    toTransformShapes.set(shape.id, {
      width: nextWidth,
      height: nextHeight,
      y: bottom + (shape.y - bottom) * scale,
      x: right + (shape.x - right) * scale,
    })
  })


  return toTransformShapes
}

export const calcSelectionBottomBoundAspectResizePatches = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const left = selectionArea.x
  const right = left + selectionArea.width

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
      mapSelectedShapes(shapes, (shape) => {
        toTransformShapes.set(shape.id, {
          y: top,
          x: right,
          width: 0,
          height: 0,
        })
      })

      return toTransformShapes
    }

    mapSelectedShapes(shapes, (shape) => {
      const aspectRatio = shape.width / shape.height

      const nextHeight = shape.height * scale
      const nextWidth = nextHeight * aspectRatio

      toTransformShapes.set(shape.id, {
        width: nextWidth,
        height: nextHeight,
        x: right + (shape.x - left) * scale,
        y: top + (shape.y - bottom) * scale,
      })
    })

    return toTransformShapes
  }

  mapSelectedShapes(shapes, (shape) => {
    const aspectRatio = shape.width / shape.height

    const nextHeight = shape.height * scale
    const nextWidth = nextHeight * aspectRatio

    toTransformShapes.set(shape.id, {
      width: nextWidth,
      height: nextHeight,
      y: top + (shape.y - top) * scale,
      x: right + (shape.x - right) * scale,
    })
  })

  return toTransformShapes
}
