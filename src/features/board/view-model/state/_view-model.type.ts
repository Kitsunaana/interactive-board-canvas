import type { ClientShape } from "@/entities/shape/model/types";
import type { Point, Rect } from "@/shared/type/shared";
import React from "react";
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
  selectedIds: Selection
  type: "shapesResize"
}

export type SelectionWindowViewState = {
  type: "selectionWindow"
  selectedIds: Selection
  startPoint: Point
  endPoint: Point
}

export type StartPenDrawViewState = {
  type: "startPenDraw"
}

export type PenDrawingViewState = {
  type: "penDrawing"
}

export type ViewModelState =
  | IdleViewState
  | ShapesResizeViewState
  | ShapesDraggingViewState
  | SelectionWindowViewState
  | StartPenDrawViewState
  | PenDrawingViewState

export type ViewModelAction = {
  onClick?: (event: React.MouseEvent) => void
  isActive?: boolean
}

export type ViewModel = {
  nodes: ClientShape[]

  selectionWindow?: Rect

  actions: {
    addSticker?: ViewModelAction
    addArrow?: ViewModelAction
  }
}

export const isIdle = (state: ViewModelState) => state.type === "idle"

export const isShapesResize = (state: ViewModelState) => state.type === "shapesResize"

export const isShapesDragging = (state: ViewModelState) => state.type === "shapesDragging"

export const isSelectionWindow = (state: ViewModelState) => state.type === "selectionWindow"

export const isStartPenDrawindow = (state: ViewModelState) => state.type === "startPenDraw"

export const isPenDrawing = (state: ViewModelState) => state.type === "penDrawing"

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

export const goToShapesResize = (state: Partial<ShapesResizeViewState> = {}): ShapesResizeViewState => ({
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