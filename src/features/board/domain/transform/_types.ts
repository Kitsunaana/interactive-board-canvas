import type { Point, Rect } from "@/shared/type/shared";
import { defaultTo } from "lodash";

export type RectWithId = Rect & { id: string }

export type ShapeToAspectResize = Rect & {
  nextWidth: number
  nextHeight: number
}

export type CalcShapeResizePatch = (
  params: {
    shape: RectWithId
    cursor: Point
  },
) => Partial<Rect>

export type CalcShapeAspectResizePatchTransform = {
  default?: (params: ShapeToAspectResize) => Partial<Rect>
  frizen?: (params: ShapeToAspectResize) => Partial<Rect>
  flip?: (params: ShapeToAspectResize) => Partial<Rect>
}

export type CalcShapeAspectResizePatch = (
  params: {
    shape: RectWithId
    cursor: Point
  },
  transform?: CalcShapeAspectResizePatchTransform
) => Partial<Rect>

export type CalcSelectionReflowPatches = (
  params: {
    selectionArea: Rect
    shapes: RectWithId[]
    cursor: Point
  }
) => Map<string, Partial<Rect>>

export type CalcSelectionResizeOffsets = (
  params: {
    selectionArea: Rect
    shapes: RectWithId[]
    cursor: Point
  }
) => Map<string, Partial<Rect>>

export type RectEdges = {
  bottom: number
  right: number
  left: number
  top: number
}

export type CalcSelectionAspectResizePatchesTransform = {
  default?: (params: Rect & { scale: number }, areaEdges: RectEdges) => Partial<Rect>
  frizen?: (params: Rect & { scale: number }, areaEdges: RectEdges) => Partial<Rect>
  flip?: (params: Rect & { scale: number }, areaEdges: RectEdges) => Partial<Rect>
}

export type CalcSelectionAspectResizePatches = (
  params: {
    selectionArea: Rect
    shapes: RectWithId[]
    cursor: Point
  },

  transform?: CalcSelectionAspectResizePatchesTransform 
) => Map<string, Partial<Rect>>

export type ResizeSingleParams = {
  shapes: RectWithId[]
  cursor: Point
}

export type ResizeMultipleParams = {
  selectionArea: Rect
  shapes: RectWithId[]
  cursor: Point
}

export const SELECTION_BOUNDS_PADDING = 7

export const withDefaultTransformHandlers = <T extends object | undefined>(transform: T) => ({
  default: () => ({}),
  frizen: () => ({}),
  flip: () => ({}),

  ...defaultTo(transform, {} as NonNullable<T>)
})