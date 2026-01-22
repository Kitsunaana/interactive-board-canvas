import type { NodeBound, NodeCorner } from "./selection-area"
import type { ShapeToRender } from "./shape"

export const isBound = (candidate: { id: string }): candidate is NodeBound => (
  candidate.id === "bottom" ||
  candidate.id === "right" ||
  candidate.id === "left" ||
  candidate.id === "top"
)

export const isCorner = (candidate: { id: string }): candidate is NodeCorner => (
  candidate.id === "bottomRight" ||
  candidate.id === "bottomLeft" ||
  candidate.id === "topRight" ||
  candidate.id === "topLeft"
)

export const isShape = (candidate: { type: string }): candidate is ShapeToRender => {
  return (
    candidate.type === "rectangle" ||
    candidate.type === "circle" ||
    candidate.type === "square"
  )
}

export const isCanvas = <T extends { type: string }>(candidate: T) => {
  return candidate.type === "grid"
}