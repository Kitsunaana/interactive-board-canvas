import type { Edge } from "./_selection/_selection.type"

export const isEdge = (candidate: { id: string }): candidate is Edge => (
  candidate.id === "bottom" ||
  candidate.id === "right" ||
  candidate.id === "left" ||
  candidate.id === "top"
)

export const isShape = <T extends { type: string }>(candidate: T) => {
  return (
    candidate.type === "rectangle" ||
    candidate.type === "circle" ||
    candidate.type === "square"
  )
}

export const isCanvas = <T extends { type: string }>(candidate: T) => {
  return candidate.type === "grid"
}