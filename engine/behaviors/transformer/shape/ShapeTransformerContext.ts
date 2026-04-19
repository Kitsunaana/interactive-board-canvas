import { type PointData } from "../../../maths"
import { Shape } from "../../../shapes/Shape"
import { ShapeTransformerGeometryState } from "./_geometry"
import { ShapeTransformerState } from "./_interface"
import { ShapeTransformerPreviewState } from "./_preview"

enum ShapeTransformState {
  PREVIEW,
  GEOMETRY
}

export class ShapeTransformerContext {
  public statesRecord: Record<ShapeTransformState, ShapeTransformerState>
  public state: ShapeTransformerState

  public needShowOrigins: boolean = false

  public constructor(private readonly _shape: Shape) {
    this.statesRecord = {
      [ShapeTransformState.PREVIEW]: new ShapeTransformerPreviewState(this._shape),
      [ShapeTransformState.GEOMETRY]: new ShapeTransformerGeometryState(this._shape),
    }

    this.state = this.statesRecord[ShapeTransformState.PREVIEW]
  }

  public transitionTo(variant: ShapeTransformState): void {
    this.state = this.statesRecord[variant]
    this.state.setContext(this)
  }

  public translate(delta: PointData) {
    this.state.translate(delta)
  }

  public rotate(angle: number): void {
    this.state.rotate(angle)
  }

  public scale(scale: PointData): void {
    this.state.scale(scale)
  }

  public skew(skew: PointData): void {
    this.state.skew(skew)
  }

  public initialize(): void {
    this.state.initialize()
  }

  public bindTransformsToContext(context: CanvasRenderingContext2D): void {
    this.state.bindTransformsToContext(context)
  }

  public render(context: CanvasRenderingContext2D): void {
    if (this.needShowOrigins) {
      this.state.render(context)
    }
  }
}