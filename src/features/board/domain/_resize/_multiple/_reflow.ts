import type { ResizeMultipleFromEdgeParams } from "../_shared"

const reflowFromLeftEdge = ({
  shapes,
  cursor,
  selectionArea
}: ResizeMultipleFromEdgeParams) => {
  const maxX = Math.max(...shapes.filter(shape => shape.isSelected).map((shape) => shape.x + shape.width))

  const delta = cursor.x - selectionArea.x

  return shapes.map((shape) => {
    if (shape.isSelected) {
      if (shape.x + shape.width === maxX) return shape

      const t = 1 - ((shape.x - selectionArea.x) / selectionArea.width)

      return {
        ...shape,
        x: shape.x + (t * delta)
      }
    }

    return shape
  })
}

const reflowFromRightEdge = ({
  shapes,
  cursor,
  selectionArea,
}: ResizeMultipleFromEdgeParams) => {
  const delta = cursor.x - (selectionArea.width + selectionArea.x)

  return shapes.map((shape) => {
    if (shape.isSelected) {
      if (selectionArea.x === shape.x) return shape

      const t = (shape.x + shape.width - selectionArea.x) / selectionArea.width

      return {
        ...shape,
        x: shape.x + (t * delta)
      }
    }

    return shape
  })
}

const reflowFromTopEdge = ({ shapes }: ResizeMultipleFromEdgeParams) => shapes

const reflowFromBottomEdge = ({ shapes }: ResizeMultipleFromEdgeParams) => shapes

export const reflow = {
  bottom: reflowFromBottomEdge,
  right: reflowFromRightEdge,
  left: reflowFromLeftEdge,
  top: reflowFromTopEdge
}