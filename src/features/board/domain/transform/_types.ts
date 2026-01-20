import type { Point, Rect } from "@/shared/type/shared";
import type { ShapeToView } from "../shape";

export type ShapeToTransform = Rect & {
  nextWidth: number
  nextHeight: number
}

export type CalcShapeFromBoundResizePatch = (
  params: {
    cursor: Point
    shape: Rect
  },
) => Partial<Rect>

export type CalcShapeFromBoundAspectResizePatch = (
  params: {
    cursor: Point
    shape: Rect
  },
  transform?: {
    default?: (params: ShapeToTransform) => Partial<Rect>
    frizen?: (params: ShapeToTransform) => Partial<Rect>
    flip?: (params: ShapeToTransform) => Partial<Rect>
  }
) => Partial<Rect>

export type CalcSelectionFromBoundReflowPatches = (
  params: {
    selectionArea: Rect
    shapes: ShapeToView[]
    cursor: Point
  }
) => Map<string, Partial<Rect>>

export type CalcSelectionLeftResizeOffsets = (
  params: {
    selectionArea: Rect
    shapes: ShapeToView[]
    cursor: Point
  }
) => Map<string, Partial<Rect>>

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

export const mapSelectedShapes = <T extends ShapeToView, R>(shapes: readonly T[], iteratee: (shape: T) => R): Array<T | R> => {
  return shapes.map((shape) => shape.isSelected ? iteratee(shape) : shape)
}

export const withDefaultTransformHandlers = (transform: Parameters<CalcShapeFromBoundAspectResizePatch>[1]) => ({
  default: () => ({}),
  frizen: () => ({}),
  flip: () => ({}),
  ...transform
})