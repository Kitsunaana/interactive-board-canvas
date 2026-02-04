import type { RotatableRect } from "@/shared/type/shared"

export type Bound = "top" | "right" | "bottom" | "left"

export type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight"

export type SelectionBounds = {
  bounds: RotatableRect[]
  area: RotatableRect
}