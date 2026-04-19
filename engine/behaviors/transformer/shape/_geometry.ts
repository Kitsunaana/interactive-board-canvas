import { type PointData } from "../../../maths"
import { Shape } from "../../../shapes/Shape"
import { ShapeTransformerState } from "./_interface"

export class ShapeTransformerGeometryState extends ShapeTransformerState {
  public constructor(private readonly _shape: Shape) {
    super()
  }

  public initialize(): void {
  }

  public translate(delta: PointData): void {
  }

  public rotate(angle: number): void {
  }

  public scale(scale: PointData): void {
  }

  public skew(skew: PointData): void {
  }

  public bindTransformsToContext(context: CanvasRenderingContext2D): void {
  }

  public render(context: CanvasRenderingContext2D): void {
  }
}
