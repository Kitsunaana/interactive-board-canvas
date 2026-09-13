import { Rectangle, type PointData } from "../maths";
import { SimObject } from "../world/sim-object";

export abstract class Shape extends SimObject {
  public static isShape(candidate: unknown): candidate is Shape {
    return candidate instanceof Shape
  }

  protected abstract _pointsToTrace: Array<PointData>
  protected abstract _initialPoints: Array<PointData>

  // public abstract getPoints(): Array<PointData>
  public abstract tracePath(context: CanvasRenderingContext2D): void
  public abstract getUnrotateBounds(): Rectangle

  public lineWidth: number = 1
  public hitLineWidth: number = 10
  public fillColor: string = "orange"
  public strokeColor: string = "black"

  public fillStrokeShape(context: CanvasRenderingContext2D) {
    context.save()

    context.lineWidth = this.lineWidth
    context.fillStyle = this.fillColor
    context.strokeStyle = this.strokeColor

    if (this.fillColor !== "none") context.fill()
    if (this.strokeColor !== "none") context.stroke()

    context.restore()
  }

  public hitFillStrokeShape(context: CanvasRenderingContext2D) {
    context.save()

    const hitColor = this.getLayerOrThrow().getHitColor(this)

    context.lineWidth = this.hitLineWidth
    context.strokeStyle = hitColor
    context.fillStyle = hitColor

    if (this.fillColor !== "none") context.fill()
    if (this.strokeColor !== "none") context.stroke()

    context.restore()
  }

  public render(context: CanvasRenderingContext2D): void {
    this.tracePath(context)
    this.fillStrokeShape(context)
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    this.tracePath(context)
    this.hitFillStrokeShape(context)
  }
}
''