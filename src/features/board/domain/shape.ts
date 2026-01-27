import type { ShapeDomain } from "@/entities/shape"

export type ShapeToRender = ShapeDomain.CanvasShape & {
  isSelected?: boolean
}
