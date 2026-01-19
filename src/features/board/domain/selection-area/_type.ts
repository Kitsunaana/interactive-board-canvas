import type { Rect } from "@/shared/type/shared"

export type Bound = "top" | "right" | "bottom" | "left"

export type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight"

export type NodeBound = {
  id: Bound
  type: "bound"
}

export type NodeCorner = {
  id: Corner,
  type: "corner"
}

export type SelectionArea = {
  bounds: Rect[]
  area: Rect
}