import type { Point, Rect, RotatableRect } from "@/shared/type/shared";
import type { Selection } from "../../domain/selection";

export type IdleViewState = {
  selectedIds: Set<string>
  mouseDown?: Point
  type: "idle"
}

export type ShapesDraggingViewState = {
  selectedIds: Selection
  needToDeselect: boolean
  type: "shapesDragging"
}

export type ShapesResizeViewState = {
  boundingBox: RotatableRect
  bounds: RotatableRect[]
  selectedIds: Selection
  type: "shapesResize"
}

export type SelectionWindowViewState = {
  type: "selectionWindow"
  selectedIds: Selection
  startPoint: Point
  endPoint: Point
}

export type ShapesRotateViewState = {
  type: "shapesRotate",
  selectedIds: Selection
  boundingBox: Rect
  rotate: number
}

export type StartPenDrawViewState = {
  type: "startPenDraw"
}

export type PenDrawingViewState = {
  type: "penDrawing"
}

export type ViewModelState =
  | SelectionWindowViewState
  | ShapesDraggingViewState
  | ShapesRotateViewState
  | ShapesResizeViewState
  | StartPenDrawViewState
  | PenDrawingViewState
  | IdleViewState

export const isIdle = (state: ViewModelState) => state.type === "idle"

export const isShapesResize = (state: ViewModelState) => state.type === "shapesResize"

export const isShapesDragging = (state: ViewModelState) => state.type === "shapesDragging"

export const isSelectionWindow = (state: ViewModelState) => state.type === "selectionWindow"

export const isStartPenDrawindow = (state: ViewModelState) => state.type === "startPenDraw"

export const isPenDrawing = (state: ViewModelState) => state.type === "penDrawing"

export const isShapesRotate = (state: ViewModelState) => state.type === "shapesRotate"

type GoToShapesRotateParams = Partial<ShapesRotateViewState> & {
  boundingBox: Rect
  rotate: number
}

export const goToShapesRotate = (state: GoToShapesRotateParams): ShapesRotateViewState => ({
  selectedIds: new Set(),
  type: "shapesRotate",
  ...state,
})

export const goToIdle = (state: Partial<IdleViewState> = {}): IdleViewState => ({
  selectedIds: new Set(),
  mouseDown: undefined,
  type: "idle",
  ...state,
})

export const goToShapesDragging = (state: Partial<ShapesDraggingViewState> = {}): ShapesDraggingViewState => ({
  selectedIds: new Set(),
  needToDeselect: false,
  type: "shapesDragging",
  ...state,
})

type GoToShapesResizeParams = Partial<ShapesResizeViewState> & {
  bounds: RotatableRect[]
  boundingBox: Rect
}

export const goToShapesResize = (state: GoToShapesResizeParams): ShapesResizeViewState => ({
  selectedIds: new Set(),
  type: "shapesResize",
  ...state,
})

export type GoToSelectionWindowParams = Partial<SelectionWindowViewState> & {
  startPoint: Point
  endPoint: Point
}

export const goToSelectionWindow = (state: GoToSelectionWindowParams): SelectionWindowViewState => ({
  type: "selectionWindow",
  selectedIds: new Set(),
  ...state,
})

export const goToStartPenDraw = (state: Partial<StartPenDrawViewState> = {}): StartPenDrawViewState => ({
  type: "startPenDraw",
  ...state,
})

export const goToPenDrawing = (state: Partial<PenDrawingViewState> = {}): PenDrawingViewState => ({
  type: "penDrawing",
  ...state,
})