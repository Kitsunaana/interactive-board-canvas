import type { Point, Rect } from "@/shared/type/shared";
import type { ShapeToView } from "../shape";

type TransformedShape = Rect & {
  nextWidth: number
  nextHeight: number
}

export type ApplyEdgeResizeParams = {
  cursor: Point
  shape: ShapeToView

  default?: (params: TransformedShape) => Partial<Rect>
  frizen?: (params: TransformedShape) => Partial<Rect>
  flip?: (params: TransformedShape) => Partial<Rect>
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

export type ResizeInteraction = {
  proportional: boolean
  reflow: boolean
  cursor: Point
}

export const SELECTION_BOUNDS_PADDING = 7

export const mapSelectedShapes = <T extends ShapeToView>(shapes: T[], iteratee: (shape: T) => T) => (
  shapes.map(shape => shape.isSelected ? iteratee(shape) : shape)
)
