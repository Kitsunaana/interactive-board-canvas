import type { ClientShape } from "@/entities/shape/model/types"
import type { Point } from "@/shared/type/shared"

export type ResizeSingleFromBoundParams = {
  shapes: ClientShape[]
  cursor: Point
}

export const mapSelectedShapes = <T extends ClientShape, R>(shapes: readonly T[], iteratee: (shape: T) => R): Array<T | R> => {
  return shapes.map((shape) => shape.client.isSelected ? iteratee(shape) : shape)
}