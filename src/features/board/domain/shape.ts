import type { ShapeDomain } from "@/entities/shape"

export type ShapeToRender = ShapeDomain.ShapeToView & {
  isSelected?: boolean
}
