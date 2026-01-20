import type { Point } from "@/shared/type/shared"
import type { ShapeToView } from "../../domain/shape"

export type ResizeSingleFromBoundParams = {
  shapes: ShapeToView[]
  cursor: Point
}

export const mapSelectedShapes = <T extends ShapeToView, R>(shapes: readonly T[], iteratee: (shape: T) => R): Array<T | R> => {
  return shapes.map((shape) => shape.isSelected ? iteratee(shape) : shape)
}