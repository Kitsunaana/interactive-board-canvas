import type { HitBound, HitCorner, HitShape } from "../modules/pick-node/_core"

export const isBound = (candidate: { type: string }): candidate is HitBound => (
  candidate.type === "bottom" ||
  candidate.type === "right" ||
  candidate.type === "left" ||
  candidate.type === "top"
)

export const isCorner = (candidate: { type: string }): candidate is HitCorner => (
  candidate.type === "bottomRight" ||
  candidate.type === "bottomLeft" ||
  candidate.type === "topRight" ||
  candidate.type === "topLeft"
)

export const isShape = (candidate: { type: string }): candidate is HitShape => {
  return candidate.type === "shape"
}

export const isCanvas = <T extends { type: string }>(candidate: T) => {
  return candidate.type === "grid"
}