import type { Rect } from "@/shared/type/shared"
import { forEach } from "lodash"
import type { CalcSelectionFromBoundAspectResizePatches, RectEdges } from "../_types"
import { SELECTION_BOUNDS_PADDING, withDefaultTransformHandlers } from "../_types"

export const calcSelectionRightBoundAspectResizePatches: CalcSelectionFromBoundAspectResizePatches = ({
  selectionArea,
  cursor,
  shapes,
}, transform) => {
  const handlers = withDefaultTransformHandlers(transform)

  const left = selectionArea.x
  const right = left + selectionArea.width
  const top = selectionArea.y
  const bottom = selectionArea.y + selectionArea.height

  const areaEdges: RectEdges = { bottom, right, left, top }

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
          y: top,
          x: left,
          width: 0,
          height: 0,
          ...handlers.frizen({ ...shape, scale }, areaEdges),
        })
      })

      return toTransformShapes
    }

    forEach(shapes, (shape) => {
      const aspectRatio = shape.height / shape.width

      const nextWidth = shape.width * scale
      const nextHeight = nextWidth * aspectRatio

      toTransformShapes.set(shape.id, {
        width: nextWidth,
        height: nextHeight,
        y: top + (shape.y - bottom) * scale,
        x: left + (shape.x - right) * scale,
        ...handlers.flip({ ...shape, scale }, areaEdges),
      })
    })

    return toTransformShapes
  }

  forEach(shapes, (shape) => {
    const aspectRatio = shape.height / shape.width

    const nextWidth = shape.width * scale
    const nextHeight = nextWidth * aspectRatio

    toTransformShapes.set(shape.id, {
      width: nextWidth,
      height: nextHeight,
      y: top + (shape.y - top) * scale,
      x: left + (shape.x - left) * scale,
      ...handlers.default({ ...shape, scale }, areaEdges),
    })
  })

  return toTransformShapes
}

export const calcSelectionLeftBoundAspectResizePatches: CalcSelectionFromBoundAspectResizePatches = ({
  selectionArea,
  cursor,
  shapes,
}, transform) => {
  const handlers = withDefaultTransformHandlers(transform)

  const left = selectionArea.x
  const right = left + selectionArea.width
  const top = selectionArea.y
  const bottom = top + selectionArea.height

  const areaEdges: RectEdges = { bottom, right, left, top }

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
          y: top,
          x: right,
          width: 0,
          height: 0,
          ...handlers.frizen({ ...shape, scale }, areaEdges),
        })
      })

      return toTransformShapes
    }

    forEach(shapes, (shape) => {
      const aspectRatio = shape.height / shape.width

      const nextWidth = shape.width * scale
      const nextHeight = nextWidth * aspectRatio

      toTransformShapes.set(shape.id, {
        width: nextWidth,
        height: nextHeight,
        y: top + (shape.y - bottom) * scale,
        x: right + (shape.x - left) * scale,
        ...handlers.flip({ ...shape, scale }, areaEdges),
      })
    })

    return toTransformShapes
  }

  forEach(shapes, (shape) => {
    const aspectRatio = shape.height / shape.width

    const nextWidth = shape.width * scale
    const nextHeight = nextWidth * aspectRatio

    toTransformShapes.set(shape.id, {
      width: nextWidth,
      height: nextHeight,
      y: top + (shape.y - top) * scale,
      x: right + (shape.x - right) * scale,
      ...handlers.default({ ...shape, scale }, areaEdges),
    })
  })

  return toTransformShapes
}

export const calcSelectionTopBoundAspectResizePatches: CalcSelectionFromBoundAspectResizePatches = ({
  selectionArea,
  cursor,
  shapes,
}, transform) => {
  const handlers = withDefaultTransformHandlers(transform)

  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const left = selectionArea.x
  const right = left + selectionArea.width

  const areaEdges: RectEdges = { bottom, right, left, top }

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
          x: right,
          y: bottom,
          width: 0,
          height: 0,
          ...handlers.frizen({ ...shape, scale }, areaEdges)
        })
      })

      return toTransformShapes
    }

    forEach(shapes, (shape) => {
      const aspectRatio = shape.width / shape.height

      const nextHeight = shape.height * scale
      const nextWidth = nextHeight * aspectRatio

      toTransformShapes.set(shape.id, {
        width: nextWidth,
        height: nextHeight,
        x: right + (shape.x - left) * scale,
        y: bottom + (shape.y - top) * scale,
        ...handlers.flip({ ...shape, scale }, areaEdges)
      })
    })

    return toTransformShapes
  }

  forEach(shapes, (shape) => {
    const aspectRatio = shape.width / shape.height

    const nextHeight = shape.height * scale
    const nextWidth = nextHeight * aspectRatio

    toTransformShapes.set(shape.id, {
      width: nextWidth,
      height: nextHeight,
      x: right + (shape.x - right) * scale,
      y: bottom + (shape.y - bottom) * scale,
      ...handlers.default({ ...shape, scale }, areaEdges)
    })
  })


  return toTransformShapes
}

export const calcSelectionBottomBoundAspectResizePatches: CalcSelectionFromBoundAspectResizePatches = ({
  selectionArea,
  cursor,
  shapes,
}, transform) => {
  const handlers = withDefaultTransformHandlers(transform)

  const top = selectionArea.y
  const bottom = top + selectionArea.height
  const left = selectionArea.x
  const right = left + selectionArea.width

  const areaEdges: RectEdges = { bottom, right, left, top }

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
          x: right,
          width: 0,
          height: 0,
          ...handlers.frizen({ ...shape, scale }, areaEdges)
        })
      })

      return toTransformShapes
    }

    forEach(shapes, (shape) => {
      const aspectRatio = shape.width / shape.height

      const nextHeight = shape.height * scale
      const nextWidth = nextHeight * aspectRatio

      toTransformShapes.set(shape.id, {
        width: nextWidth,
        height: nextHeight,
        x: right + (shape.x - left) * scale,
        y: top + (shape.y - bottom) * scale,
        ...handlers.flip({ ...shape, scale }, areaEdges)
      })
    })

    return toTransformShapes
  }

  forEach(shapes, (shape) => {
    const aspectRatio = shape.width / shape.height

    const nextHeight = shape.height * scale
    const nextWidth = nextHeight * aspectRatio

    toTransformShapes.set(shape.id, {
      width: nextWidth,
      height: nextHeight,
      y: top + (shape.y - top) * scale,
      x: right + (shape.x - right) * scale,
      ...handlers.default({ ...shape, scale }, areaEdges)
    })
  })

  return toTransformShapes
}

export const Short = {
  bottom: calcSelectionBottomBoundAspectResizePatches,
  right: calcSelectionRightBoundAspectResizePatches,
  left: calcSelectionLeftBoundAspectResizePatches,
  top: calcSelectionTopBoundAspectResizePatches,
}