export {
  selectedShapesIds$,
  shapesToRecord$,
  shapesToRender$,
  viewModel$,
  viewState$,
} from "./_view-model"

export type {
  ShapesDraggingViewState,
  ShapesResizeViewState,
  ViewModelState,
  IdleViewState,

  ViewModel,
  ViewModelAction,
} from "./_view-model.type"

export {
  goToShapesDragging,
  goToShapesResize,
  goToIdle,

  isShapesDragging,
  isShapesResize,
  isIdle,
} from "./_view-model.type"