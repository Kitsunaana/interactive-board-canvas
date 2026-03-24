import { isUndefined } from "lodash";
import { Node, type NodeConfig } from "../Node";
import * as Primitive from "../maths";
import { Point } from "../maths";


export interface PolygonConfig extends NodeConfig {
  points: Primitive.PointData[],
  name?: string | undefined
}

export class Polygon extends Node {
  protected readonly _type = "Shape" as const

  public readonly originScale: Primitive.Point = new Primitive.Point()
  public readonly originRotate: Primitive.Point = new Primitive.Point()
  public readonly math: Primitive.Polygon

  private readonly _bounds: Primitive.Rectangle = new Primitive.Rectangle()

  private static _fillConfigDefaultValues(config: PolygonConfig) {
    const { x, y, scaleX, scaleY, ...other } = config
    
    return {
      isDraggable: false,
      position: new Point(x ?? 0, y ?? 0),
      scale: new Point(scaleX ?? 1, scaleY ?? 1),
      ...other,
    }
  }

  private static _getAbsoluteOrigin(ptr: Primitive.PointData, bounds: Primitive.Rectangle) {
    return {
      x: bounds.x + bounds.width * ptr.x,
      y: bounds.y + bounds.height * ptr.y,
    }
  }

  private static _parseTransformOriginString(value: string) {
    const [first, second] = value.replaceAll("%", "").split(" ")
    if (isUndefined(second)) return { x: 0, y: 0 }

    const x = Number(first) / 100
    const y = Number(second) / 100

    return {
      x,
      y,
    }
  }

  public get absolutePositionCursor() {
    return this.getParent()!.absolutePositionCursor
  }

  public constructor(config: PolygonConfig) {
    super(config)

    const filledConfing = Polygon._fillConfigDefaultValues(config)
    this.math = new Primitive.Polygon(config.points)

    this.setOriginScale("50% 0%")
    this.setOriginRotate("50% 50%")

    this.scale(filledConfing.scale)
  }

  public setOriginRotate(origin: string): void {
    this.originRotate.copyFrom(this._getOriginPointFromString(origin))
  }

  public setOriginScale(origin: string): void {
    this.originScale.copyFrom(this._getOriginPointFromString(origin))
  }

  public scale(scale: Primitive.PointData) {
    this.setScale(Primitive.Point.add(scale, this.getScale()))

    const angle = this.getAngle()

    if (angle !== 0) {
      Primitive.Polygon.rotate(this.math.points, -angle, this.originRotate)

      const tempOriginScale = Primitive.rotatePointAroundOrigin(this.originScale, this.originRotate, -angle)
      const nextOriginRotate = Primitive.scalePointAroundOrigin(this.originRotate, tempOriginScale, scale)
      
      Primitive.Polygon.scale(this.math.points, scale, tempOriginScale)
      Primitive.Polygon.rotate(this.math.points, angle, nextOriginRotate)

      const nextOriginScale = Primitive.rotatePointAroundOrigin(tempOriginScale, nextOriginRotate, angle)

      this.originScale.copyFrom(nextOriginScale)
      this.originRotate.copyFrom(nextOriginRotate)
    } else {
      Primitive.Polygon.scale(this.math.points, scale, this.originScale)

      const nextOriginScale = Primitive.scalePointAroundOrigin(this.originRotate, this.originScale, scale)

      this.originRotate.copyFrom(nextOriginScale)
    }
  }

  public rotate(angle: number): void {
    const prevAngle = this.getAngle()
    this.setAngle(angle + prevAngle)

    Primitive.Polygon.rotate(this.math.points, angle, this.originRotate)

    const next = Primitive.rotatePointAroundOrigin(this.originScale, this.originRotate, angle)

    this.originScale.copyFrom(next)
  }

  public contains(point: Primitive.PointData): boolean {
    return this.math.contains(point.x, point.y)
  }

  public getClientRect(): Primitive.Rectangle {
    this.math.getBounds(this._bounds)
    Point.add(this._bounds, this.getPosition(), this._bounds)
    return this._bounds
  }

  public drawOriginPoint(
    context: CanvasRenderingContext2D,
    point: Primitive.PointData,
    text: string,
    color: string
  ): void {
    context.save()
    context.font = "14px Arial"
    context.textAlign = "center"
    context.textBaseline = "bottom"
    context.fillText(text, point.x, point.y - 5)
    context.fillStyle = color
    context.beginPath()
    context.arc(point.x, point.y, 5, 0, Math.PI * 2)
    context.closePath()
    context.fill()
    context.restore()
  }

  public draw(context: CanvasRenderingContext2D): void {
    const position = this.getPosition()

    context.save()
    context.translate(position.x, position.y)

    context.fillStyle = "darkorange"
    context.beginPath()
    this.math.points.forEach((point) => context.lineTo(point.x, point.y))
    context.closePath()
    context.stroke()
    context.fill()

    context.restore()

    this.drawOriginPoint(context, this.originScale, "scale", "red")
    this.drawOriginPoint(context, this.originRotate, "rotate", "blue")
  }

  private _getOriginPointFromString(origin: string) {
    const points = this.math.points.map(point => ({ ...point }))
    const angle = this.getAngle()

    Primitive.Polygon.rotate(points, -angle, this.originRotate)

    const bounds = Primitive.Polygon.prototype.getBounds.call({ points })

    const unrotatedOriginPoint = Polygon._getAbsoluteOrigin(Polygon._parseTransformOriginString(origin), bounds)
    const nextOriginPoint = Primitive.rotatePointAroundOrigin(unrotatedOriginPoint, this.originRotate, angle)

    return nextOriginPoint
  }
}