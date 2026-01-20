import type { Point, Rect } from "@/shared/type/shared";
import { defaultTo } from "lodash";

export type RectWithId = Rect & { id: string }

export type ShapeToAspectResize = Rect & {
  nextWidth: number
  nextHeight: number
}

export type CalcShapeFromBoundResizePatch = (
  params: {
    shape: RectWithId
    cursor: Point
  },
) => Partial<Rect>

export type CalcShapeFromBoundAspectResizePatchTransform = {
  default?: (params: ShapeToAspectResize) => Partial<Rect>
  frizen?: (params: ShapeToAspectResize) => Partial<Rect>
  flip?: (params: ShapeToAspectResize) => Partial<Rect>
}

export type CalcShapeFromBoundAspectResizePatch = (
  params: {
    shape: RectWithId
    cursor: Point
  },
  transform?: CalcShapeFromBoundAspectResizePatchTransform
) => Partial<Rect>

export type CalcSelectionFromBoundReflowPatches = (
  params: {
    selectionArea: Rect
    shapes: RectWithId[]
    cursor: Point
  }
) => Map<string, Partial<Rect>>

export type CalcSelectionLeftResizeOffsets = (
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

export type CalcSelectionFromBoundAspectResizePatchesTransform = {
  default?: (params: Rect & { scale: number }, areaEdges: RectEdges) => Partial<Rect>
  frizen?: (params: Rect & { scale: number }, areaEdges: RectEdges) => Partial<Rect>
  flip?: (params: Rect & { scale: number }, areaEdges: RectEdges) => Partial<Rect>
}

export type CalcSelectionFromBoundAspectResizePatches = (
  params: {
    selectionArea: Rect
    shapes: RectWithId[]
    cursor: Point
  },

  transform?: CalcSelectionFromBoundAspectResizePatchesTransform 
) => Map<string, Partial<Rect>>

export type ResizeSingleFromBoundParams = {
  shapes: RectWithId[]
  cursor: Point
}

export type ResizeMultipleFromBoundParams = {
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