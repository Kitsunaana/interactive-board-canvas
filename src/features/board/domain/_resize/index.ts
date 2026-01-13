import { match } from "@/shared/lib/match"
import type { Point } from "@/shared/type/shared"
import { map, omit } from "lodash"
import type { SelectionBounds } from "../../modules/_pick-node/_core"
import type { Bound, Selection } from "../_selection/_selection.type"
import type { Shape, ShapeToView } from "../_shape"
import { resizeShapeFromEdge } from "./_independent"
import { reflowMultiShapes } from "./_reflow-multi-shapes"

const PADDING = 7

const mapSelectedShapes = (shapes: ShapeToView[], iteratee: (shape: Shape) => Shape) => (
  map(shapes, (shape) => (
    shape.isSelected
      ? iteratee(shape)
      : shape
  ))
)

const resizeMultiShapesFromLeftEdge = ({
  selectionBounds,
  canvasPoint,
  shapes,
}: {
  selectionBounds: SelectionBounds
  shapes: ShapeToView[]
  canvasPoint: Point
}) => {
  const area = selectionBounds.area
  const left = area.x
  const right = area.x + area.width

  const pointX = canvasPoint.x + PADDING
  const delta = left - pointX

  const prevWidth = area.width
  const nextWidth = prevWidth + delta
  const scale = nextWidth / prevWidth

  if (nextWidth <= 0) {
    const delta = pointX - right
    const nextWidth = delta - PADDING * 2
    const scale = nextWidth / prevWidth

    if (nextWidth <= 0) {
      return mapSelectedShapes(shapes, (shape) => ({
        ...shape,
        width: 0,
        x: right,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => ({
      ...shape,
      width: shape.width * scale,
      x: right + (shape.x - left) * scale,
    }))
  }

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    width: shape.width * scale,
    x: right + (shape.x - right) * scale,
  }))
}

const resizeMultiNodesFromRightEdge = ({ shapes, selectionBounds, canvasPoint }: {
  selectionBounds: SelectionBounds
  shapes: ShapeToView[]
  canvasPoint: Point
}) => {
  const cursorPositionX = canvasPoint.x - PADDING
  const area = selectionBounds.area

  const right = area.x + area.width
  const left = area.x

  const delta = cursorPositionX - right

  const prevWidth = area.width
  const nextWidth = prevWidth + delta

  const scale = nextWidth / prevWidth

  if (nextWidth <= 0) {
    const delta = left - cursorPositionX
    const nextWidth = delta - PADDING * 2
    const scale = nextWidth / prevWidth

    if (nextWidth <= 0) {
      return mapSelectedShapes(shapes, (shape) => ({
        ...shape,
        width: 0,
        x: left,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => ({
      ...shape,
      width: shape.width * scale,
      x: left + (shape.x - right) * scale,
    }))
  }

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    width: shape.width * scale,
    x: left + (shape.x - left) * scale,
  }))
}

const resizeMultiNodesFromTopEdge = ({ shapes, selectionBounds, canvasPoint }: {
  selectionBounds: SelectionBounds
  shapes: ShapeToView[]
  canvasPoint: Point
}) => {
  const area = selectionBounds.area
  const cursorPositionY = canvasPoint.y + PADDING

  const top = area.y
  const bottom = top + area.height

  const delta = top - cursorPositionY
  const prevHeight = area.height
  const nextHeight = prevHeight + delta

  const scale = nextHeight / prevHeight

  if (nextHeight <= 0) {
    const delta = cursorPositionY - bottom
    const nextHeight = delta - PADDING * 2
    const scale = nextHeight / prevHeight

    if (nextHeight <= 0) {
      return mapSelectedShapes(shapes, (shape) => ({
        ...shape,
        height: 0,
        y: bottom,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => ({
      ...shape,
      height: shape.height * scale,
      y: bottom + (shape.y - top) * scale,
    }))
  }

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    height: shape.height * scale,
    y: bottom + (shape.y - bottom) * scale,
  }))
}

const resizeMultiNodesFromBottomEdge = ({ shapes, selectionBounds, canvasPoint }: {
  selectionBounds: SelectionBounds
  shapes: ShapeToView[]
  canvasPoint: Point
}) => {
  const cursorPositionY = canvasPoint.y - PADDING
  const area = selectionBounds.area

  const top = area.x
  const bottom = top + area.height
  const delta = cursorPositionY - bottom
  
  const prevHeight = area.height
  const nextHeight = prevHeight + delta

  const scale = nextHeight / prevHeight

  if (nextHeight <= 0) {
    const delta = top - cursorPositionY
    const nextHeight = delta - PADDING * 2

    const scale = nextHeight / prevHeight

    if (nextHeight <= 0) {
      return mapSelectedShapes(shapes, (shape) => ({
        ...shape,
        y: top,
        height: 0,
      }))
    }

    return mapSelectedShapes(shapes, (shape) => ({
      ...shape,
      height: shape.height * scale,
      y: top + (shape.y - bottom) * scale,
    }))
  }

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    height: shape.height * scale,
    y: top + (shape.y - top) * scale,
  }))
}

type ResizeInteraction = {
  proportional: boolean
  reflow: boolean

  canvasPoint: Point
}

const resizeMultiShapesFromEdge = ({ node, ...params }: {
  selectionBounds: SelectionBounds
  selectedIds: Selection
  shapes: ShapeToView[]
  node: Bound
}) => {
  return match(node, {
    top: () => ({ canvasPoint }: ResizeInteraction) => {
      return resizeMultiNodesFromTopEdge({ ...params, canvasPoint })
    },

    bottom: () => ({ canvasPoint }: ResizeInteraction) => {
      return resizeMultiNodesFromBottomEdge({ ...params, canvasPoint })
    },

    right: () => {
      return ({ reflow, canvasPoint }: ResizeInteraction) => reflow
        ? reflowMultiShapes.right({ ...params, canvasPoint })
        : resizeMultiNodesFromRightEdge({ ...params, canvasPoint })
    },

    left: () => {
      return ({ reflow, canvasPoint }: ResizeInteraction) => reflow
        ? reflowMultiShapes.left({ ...params, canvasPoint })
        : resizeMultiShapesFromLeftEdge({ ...params, canvasPoint })
    }
  }, "id")
}

export const getShapesResizeStrategy = (params: {
  selectionBounds: SelectionBounds
  selectedIds: Selection
  shapes: ShapeToView[]
  node: Bound
}) => {
  return params.selectedIds.size > 1
    ? resizeMultiShapesFromEdge(params)
    : resizeShapeFromEdge(omit(params, "selectionBounds"))
}