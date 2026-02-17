import type { Bound } from "@/features/board/domain/selection-area"
import type { PointData } from "../maths"
import * as Shapes from "../shapes"

export interface ResizeTransformerStrategy {
  start(shape: Shapes.Polygon, bound: Bound): void
  draw(context: CanvasRenderingContext2D): void
  resize(cursor: PointData): void
}