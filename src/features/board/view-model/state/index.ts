export {
  selectedShapesIds$,
  shapesToRecord$,
  shapesToView$ as shapesToRender$,
  viewState$,
} from "./_view-model"

export type {
  ShapesDraggingViewState,
  ShapesResizeViewState,
  ViewModelState,
  IdleViewState,
} from "./_view-model.type"

export {
  goToShapesDragging,
  goToShapesResize,
  goToIdle,

  isShapesDragging,
  isShapesResize,
  isIdle,
} from "./_view-model.type"