import type { Point, Rect } from "@/shared/type/shared";
import { map } from "lodash";
import type { ShapeToView } from "../_shape";

export type ApplyEdgeResizeParams = {
  shape: ShapeToView
  cursor: Point
}

export type ResizeSingleFromEdgeParams = {
  shapes: ShapeToView[]
  cursor: Point
}

export type ResizeMultipleFromEdgeParams = {
  shapes: ShapeToView[]
  selectionArea: Rect
  cursor: Point
}

export const mapSelectedShapes = <T extends ShapeToView>(shapes: T[], iteratee: (shape: T) => T) => (
  map(shapes, (shape) => shape.isSelected ? iteratee(shape) : shape)
)
