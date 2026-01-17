import type { Point, Rect } from "@/shared/type/shared";
import type { ShapeToView } from "../shape";

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

export const SELECTION_BOUNDS_PADDING = 7

export const mapSelectedShapes = <T extends ShapeToView>(shapes: T[], iteratee: (shape: T) => T) => (
  shapes.map(shape => shape.isSelected ? iteratee(shape) : shape)
)
