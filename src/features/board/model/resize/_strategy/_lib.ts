import type { Point } from "@/shared/type/shared"
import type { ShapeToRender } from "../../../domain/shape"

export type ResizeSingleFromBoundParams = {
  shapes: ShapeToRender[]
  cursor: Point
}

export const mapSelectedShapes = <T extends ShapeToRender, R>(shapes: readonly T[], iteratee: (shape: T) => R): Array<T | R> => {
  return shapes.map((shape) => shape.isSelected ? iteratee(shape) : shape)
}