import { Point, Polygon, rotatePointAroundOrigin, scalePointAroundOrigin, skewPointAroundOrigin, type PointData } from "../../../maths"
import { Shape } from "../../../shapes/Shape"
import { drawOriginPoint } from "../../Transformable"
import { ShapeTransformerState, TRANSFORM_OPERATIONS, type TramsformOperation, buildInitialOpearationsRecord } from "./_interface"

export class ShapeTransformerPreviewState extends ShapeTransformerState {
  private _translate: Point = new Point(0, 0)
  private _scale: Point = new Point(1, 1)
  private _skew: Point = new Point(0, 0)
  private _angle: number = 0

  public relativeOrigins = buildInitialOpearationsRecord()
  public absoluteOrigins = buildInitialOpearationsRecord()
  public nextAbsoluteOrigins = buildInitialOpearationsRecord()

  public constructor(private readonly _shape: Shape) {
    super()
  }

  public initialize(): void {
    this.relativeOrigins.rotate.set(0.5, 0.5)
    this.relativeOrigins.scale.set(0.0, 0.0)
    this.relativeOrigins.skew.set(1.0, 1.0)

    TRANSFORM_OPERATIONS.forEach((operation) => this.setAbsoluteOrigin(operation))
    this.setUpdatedOrigins()
  }

  public translate(delta: PointData) {
    this._translate.copyFrom(Point.add(this._translate, delta))
    this.setUpdatedOrigins()
  }

  public rotate(angle: number): void {
    this._angle += angle
    this.setUpdatedOrigins()
  }

  public scale(scale: PointData): void {
    this._scale.copyFrom(Point.multiple(scale, this._scale))
    this.setUpdatedOrigins()
  }

  public skew(skew: PointData): void {
    this._skew.copyFrom(Point.add(skew, this._skew))
    this.setUpdatedOrigins()
  }

  public setUpdatedOrigins(): void {
    TRANSFORM_OPERATIONS.forEach((operation) => {
      const next = this._getNextOrigin(this.absoluteOrigins[operation])
      this.nextAbsoluteOrigins[operation].copyFrom(next)
    })
  }

  private _getNextOrigin(origin: PointData): PointData {
    const originAngle = this.absoluteOrigins.rotate
    const originScale = this.absoluteOrigins.scale
    const originSkew = this.absoluteOrigins.skew

    const unrotated = rotatePointAroundOrigin(origin, origin, -this._angle)
    const skewed = skewPointAroundOrigin(unrotated, originSkew, this._skew)
    const scaled = scalePointAroundOrigin(skewed, originScale, this._scale)
    const rotated = rotatePointAroundOrigin(scaled, originAngle, this._angle)
    const translated = Point.add(rotated, this._translate)

    return translated
  }

  public render(context: CanvasRenderingContext2D): void {
    context.save()
    context.fillStyle = "black"

    TRANSFORM_OPERATIONS.forEach((operation) => {
      drawOriginPoint(context, this.nextAbsoluteOrigins[operation], operation)
    })

    context.restore()
  }

  public bindTransformsToContext(context: CanvasRenderingContext2D): void {
    const originAngle = this.absoluteOrigins.rotate
    const originScale = this.absoluteOrigins.scale
    const originSkew = this.absoluteOrigins.skew

    context.translate(this._translate.x, this._translate.y)

    const rotate = () => {
      context.translate(originAngle.x, originAngle.y)
      context.rotate(this._angle)
      context.translate(-originAngle.x, -originAngle.y)
    }

    const scale = () => {
      context.translate(originScale.x, originScale.y)
      context.scale(this._scale.x, this._scale.y)
      context.translate(-originScale.x, -originScale.y)
    }

    const skew = () => {
      context.translate(originSkew.x, originSkew.y)
      context.transform(1, Math.tan(this._skew.y), Math.tan(this._skew.x), 1, 0, 0)
      context.translate(-originSkew.x, -originSkew.y)
    }

    scale()
    rotate()
    skew()
  }

  public setAbsoluteOrigin(operation: TramsformOperation, relativeOrigin?: PointData): void {
    relativeOrigin ||= this.absoluteOrigins[operation]
    
    const copiedPoints = this._shape.points.map((point) => ({ ...point }))
    Polygon.rotate(copiedPoints, -this._angle, relativeOrigin)

    const bounds = Polygon.prototype.getBounds.call({ points: copiedPoints })

    const base: PointData = {
      x: bounds.x + bounds.width * this.relativeOrigins[operation].x,
      y: bounds.y + bounds.height * this.relativeOrigins[operation].y,
    }

    this.absoluteOrigins[operation].set(base.x, base.y)
  }
}

