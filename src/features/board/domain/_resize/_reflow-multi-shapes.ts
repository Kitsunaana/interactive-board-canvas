import type { Point } from "@/shared/type/shared"
import type { SelectionBounds } from "../../modules/_pick-node/_core"
import type { Selection } from "../_selection/_selection.type"
import type { Shape } from "../_shape"

type ReflowMultiNodesFromEdgeParams = {
  selectionBounds: SelectionBounds
  selectedIds: Selection
  canvasPoint: Point
  shapes: Shape[]
}

const reflowMultiNodesFromLeftEdge = ({
  selectionBounds,
  selectedIds,
  canvasPoint,
  shapes,
}: ReflowMultiNodesFromEdgeParams) => {
  const maxX = Math.max(...shapes
    .filter(shape => selectedIds.has(shape.id))
    .map((shape) => shape.x + shape.width)
  )

  const area = selectionBounds.area
  const delta = canvasPoint.x - area.x

  return shapes.map((shape) => {
    if (selectedIds.has(shape.id)) {
      if (shape.x + shape.width === maxX) return shape

      const t = 1 - ((shape.x - area.x) / area.width)

      return {
        ...shape,
        x: shape.x + (t * delta)
      }
    }

    return shape
  })
}

const reflowMultiNodesFromRightEdge = ({
  selectionBounds,
  selectedIds,
  canvasPoint,
  shapes,
}: ReflowMultiNodesFromEdgeParams) => {
  const area = selectionBounds.area
  const delta = canvasPoint.x - (area.width + area.x)

  return shapes.map((shape) => {
    if (selectedIds.has(shape.id)) {
      if (area.x === shape.x) return shape

      const t = (shape.x + shape.width - area.x) / area.width

      return {
        ...shape,
        x: shape.x + (t * delta)
      }
    }

    return shape
  })
}

const reflowMultiNodesFromTopEdge = ({ shapes }: ReflowMultiNodesFromEdgeParams) => shapes
const reflowMultiNodesFromBottomEdge = ({ shapes }: ReflowMultiNodesFromEdgeParams) => shapes

export const reflowMultiShapes = {
  bottom: reflowMultiNodesFromBottomEdge,
  right: reflowMultiNodesFromRightEdge,
  left: reflowMultiNodesFromLeftEdge,
  top: reflowMultiNodesFromTopEdge
}