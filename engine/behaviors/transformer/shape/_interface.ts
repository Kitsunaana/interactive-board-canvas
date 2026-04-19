import { Point, type PointData } from "../../../maths/Point"
import { ShapeTransformerContext } from "./ShapeTransformerContext"

export type TramsformOperation = "scale" | "skew" | "rotate"

export const TRANSFORM_OPERATIONS = ["rotate", "skew", "scale"] as Array<TramsformOperation>

export const buildInitialOpearationsRecord = (): Record<TramsformOperation, Point> => ({
  rotate: new Point(),
  scale: new Point(),
  skew: new Point(),
})

export abstract class ShapeTransformerState {
  protected context!: ShapeTransformerContext

  public setContext(context: ShapeTransformerContext) {
    this.context = context
  }

  public abstract initialize(): void

  public abstract translate(delta: PointData): void
  public abstract rotate(angle: number): void
  public abstract scale(scale: PointData): void
  public abstract skew(skew: PointData): void

  public abstract bindTransformsToContext(context: CanvasRenderingContext2D): void
  public abstract render(context: CanvasRenderingContext2D): void
}
