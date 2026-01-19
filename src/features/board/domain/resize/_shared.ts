import type { Point, Rect } from "@/shared/type/shared";
import type { ShapeToView } from "../shape";
import { map } from "lodash";

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

export type RectEdges = {
  top: number
  left: number
  right: number
  bottom: number
}

export type ResizeMultipleFromEdgeParams = {
  shapes: ShapeToView[]
  selectionArea: Rect
  cursor: Point

  default?: (scale: number, shape: ShapeToView, area: RectEdges) => Partial<ShapeToView>
  frizen?: (scale: number, shape: ShapeToView, area: RectEdges) => Partial<ShapeToView>
  flip?: (scale: number, shape: ShapeToView, area: RectEdges) => Partial<ShapeToView>
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