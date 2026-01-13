export { getShapesResizeStrategy } from "./_resize"

export { computeSelectionBoundsRect, selectItems, shapeSelect } from "./_selection"

export { isBound, isCanvas, isShape } from "./_is"

export { startMoveShape, moveShape as movingShape, endMoveShape } from "./_moving"

export type {
  CanvasGridDots,
  CanvasGridLines,
  CanvasGridNone,
  CanvasGridSquare,
  CanvasGridVariant
} from "./_canvas"

export type {
  Rectangle,
  RectangleToView,
  
  Arrow,
  ArrowToView,
  
  Circle,
  CircleToView,
  
  Square,
  SquareToView,
  
  Shape,
  ShapeToView,
} from "./_shape"