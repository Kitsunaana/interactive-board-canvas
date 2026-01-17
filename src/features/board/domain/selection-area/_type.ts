import type { Rect } from "@/shared/type/shared"

export type Bound = "top" | "right" | "bottom" | "left"

export type NodeBound = {
  id: Bound
  type: "bound"
}

export type SelectionArea = {
  bounds: Rect[]
  area: Rect
}