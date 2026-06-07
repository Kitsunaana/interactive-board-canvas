import { Matrix3x3, Polygon, Rectangle, type PointData } from "../maths";
import { BackgroundImage } from "../styles/background-image";
import { SimObject } from "../world/sim-object";
import { BaseGradient } from "../styles/gradient"
import { isNil } from "lodash";

export abstract class Node extends SimObject {

}

export type SketchFillStyle =
  | "hachure"
  | "solid"
  | "zigzag"
  | "cross-hatch"
  | "dots"
  | "dashed"
  | "zigzag-line"

export abstract class Shape extends Node {
  public abstract pointsToTrace: Array<PointData>
  public abstract initialPoints: Array<PointData>

  public abstract tracePath(context: CanvasRenderingContext2D): void

  public lineWidth: number = 5
  public fillColor: string = "none"
  public strokeColor: string = "black"
  public backgroundImage: BackgroundImage | null = null
  public backgroundGradient: BaseGradient | null = null

  public sketchStyle: boolean = false
  public sketchFillStyle: SketchFillStyle = "zigzag"

  public static isShape(candidate: unknown): candidate is Shape {
    return candidate instanceof Shape
  }

  public applyStylesToBounds(bounds: Rectangle): Rectangle {
    const halfLineWidth = this.lineWidth / 2
    
    bounds.x -= halfLineWidth
    bounds.y -= halfLineWidth
    bounds.width += this.lineWidth
    bounds.height += this.lineWidth
    
    return bounds
  }

  public updateAfterTransform(): void {
    const matrix = Matrix3x3.compose(this._worldMatrix, this._localMatrix)

    this.pointsToTrace = this.initialPoints.map((point) => matrix.applyToPoint(point))
  }

  private _drawBackgroundImage(context: CanvasRenderingContext2D): void {
    const pattern = this.backgroundImage && this.backgroundImage.getImagePattern(context)
    if (isNil(pattern)) return

    this.tracePath(context)

    context.save()
    Matrix3x3
      .aroundOrigin(this.getOriginPosition("rotate"), () => Matrix3x3.rotate(this.getCurrentAngle()))
      .applyToContext(context)

    context.fillStyle = pattern
    context.fill()
    context.restore()
  }

  private _drawBackgroundGradient(context: CanvasRenderingContext2D): void {
    const gradient = this.backgroundGradient && this.backgroundGradient.getGradient(context)
    if (isNil(gradient)) return

    this.tracePath(context)

    context.save()
    context.fillStyle = gradient
    context.fill()
    context.restore()
  }

  private _drawShapeBounds(context: CanvasRenderingContext2D): void {
    const bounds = this.getBounds({ skipTransform: false })

    context.save()
    context.lineWidth = 1
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    context.restore()
  }

  public render(context: CanvasRenderingContext2D): void {
    this._drawBackgroundImage(context)
    this._drawBackgroundGradient(context)

    if (this.sketchStyle) {
      this.layer()!.rc.path(Polygon.getSVGPath(this.pointsToTrace), {
        seed: 3,
        fill: this.fillColor,
        stroke: this.strokeColor,
        fillStyle: this.sketchFillStyle,
      })
      return
    }

    this.tracePath(context)

    context.lineWidth = this.lineWidth

    if (this.fillColor !== "none") {
      context.fillStyle = this.fillColor
      context.fill()
    }

    if (this.strokeColor !== "none") {
      context.strokeStyle = this.strokeColor
      context.stroke()
    }

    this._drawShapeBounds(context)
  }
}
