import type { Point, Rect } from "@/shared/type/shared";
import type { ShapeToView } from "../shape";

type TransformedShape = Rect & {
  nextWidth: number
  nextHeight: number
}

export type ApplyBoundResizeParams = {
  cursor: Point
  shape: ShapeToView

  default?: (params: TransformedShape) => Partial<Rect>
  frizen?: (params: TransformedShape) => Partial<Rect>
  flip?: (params: TransformedShape) => Partial<Rect>
}

export type ResizeSingleFromBoundParams = {
  shapes: ShapeToView[]
  cursor: Point
}

export type RectBounds = {
  top: number
  left: number
  right: number
  bottom: number
}

export type ResizeMultipleFromBoundParams = {
  shapes: ShapeToView[]
  selectionArea: Rect
  cursor: Point

  default?: (scale: number, shape: ShapeToView, area: RectBounds) => Partial<ShapeToView>
  frizen?: (scale: number, shape: ShapeToView, area: RectBounds) => Partial<ShapeToView>
  flip?: (scale: number, shape: ShapeToView, area: RectBounds) => Partial<ShapeToView>
}

export type ResizeInteraction = {
  proportional: boolean
  reflow: boolean
  cursor: Point
}

export const SELECTION_BOUNDS_PADDING = 7

export const mapSelectedShapes = <T extends ShapeToView, G>(shapes: T[], iteratee: (shape: T) => G) => (
  shapes.map(shape => shape.isSelected ? iteratee(shape) : shape)
)