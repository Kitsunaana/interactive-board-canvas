import type { ClientShape } from "@/entities/shape/model/types"
import type { NodeBound, NodeCorner } from "./selection-area"

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

export const isShape = (candidate: { kind: string }): candidate is ClientShape => {
  return candidate.kind === "shape"
}

export const isCanvas = <T extends { type: string }>(candidate: T) => {
  return candidate.type === "grid"
}