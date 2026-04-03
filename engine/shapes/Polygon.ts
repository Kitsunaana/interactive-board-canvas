import { Mixin } from "ts-mixer";
import { Node, type NodeConfig } from "../Node";
import * as Primitive from "../maths";
import { Point } from "../maths";

export interface PolygonConfig extends NodeConfig {
  points: Primitive.PointData[],
  name?: string | undefined
}

function fillConfigDefaultValues(config: PolygonConfig) {
  const { x, y, scaleX, scaleY, ...other } = config

  return {
    isDraggable: false,
    position: new Point(x ?? 0, y ?? 0),
    scale: new Point(scaleX ?? 1, scaleY ?? 1),
    ...other,
  }
}

function drawOriginPoint(context: CanvasRenderingContext2D, point: Primitive.PointData, caption: string) {
  context.save()
  context.beginPath()
  context.arc(point.x, point.y, 5, 0, Math.PI * 2, false)
  context.textAlign = "center"
  context.textBaseline = "bottom"
  context.font = "14px Arial"
  context.fillText(caption, point.x, point.y - 5)
  context.stroke()
  context.fill()
  context.restore()
}

export class Polygon extends Mixin(Node) {
  protected readonly _type = "Shape" as const

  private readonly _bounds = new Primitive.Rectangle()
  private readonly _matrix = new Primitive.Matrix()

  public readonly originRotate = new Point()
  public readonly originScale = new Point()

  public get absolutePositionCursor() {
    return this.getParent()!.absolutePositionCursor
  }

  public constructor(config: PolygonConfig) {
    super(config)

    const filledConfing = fillConfigDefaultValues(config)
    this.points = filledConfing.points
  }

  public getPoints(): Array<Primitive.PointData> {
    return this.points.map((point) => ({ ...point }))
  }

  public setOriginScale(point: Primitive.PointData, type: "rotate" | "scale") {
    const points = this.getPoints()
    const angle = this.getAngle()

    Primitive.Polygon.rotate(points, -angle, this.originRotate)
    const bounds = Primitive.Polygon.prototype.getBounds.call({ points })

    const base = {
      x: bounds.x + bounds.width * point.x,
      y: bounds.y + bounds.height * point.y,
    }

    const next = Primitive.rotatePointAroundOrigin(base, this.originRotate, angle)

      ; ({
        rotate: this.originRotate,
        scale: this.originScale,
      })[type].copyFrom(next)
  }

  public rotate(angle: number) {
    this.setAngle(this.getAngle() + angle)

    this.points.forEach((point) => {
      const next = Primitive.rotatePointAroundOrigin(point, this.originRotate, angle)

      point.x = next.x
      point.y = next.y
    })

    const nextOriginScale = Primitive.rotatePointAroundOrigin(this.originScale, this.originRotate, angle)
    this.originScale.copyFrom(nextOriginScale)
  }

  public scale(value: Primitive.PointData) {
    this.setScale(Point.multiple(this.getScale(), value))

    const angle = this.getAngle()

    this.points.forEach((point) => {
      const unrotated = Primitive.rotatePointAroundOrigin(point, this.originScale, -angle)
      const scaled = Primitive.scalePointAroundOrigin(unrotated, this.originScale, value)
      const rotated = Primitive.rotatePointAroundOrigin(scaled, this.originScale, angle)

      point.x = rotated.x
      point.y = rotated.y
    })

    const unrotated = Primitive.rotatePointAroundOrigin(this.originRotate, this.originScale, -angle)
    const scaled = Primitive.scalePointAroundOrigin(unrotated, this.originScale, value)
    const nextOriginRotate = Primitive.rotatePointAroundOrigin(scaled, this.originScale, angle)

    this.originRotate.copyFrom(nextOriginRotate)
  }

  public getClientRect(): Primitive.Rectangle {
    this.getBounds(this._bounds)
    Point.add(this._bounds, this.getPosition(), this._bounds)
    return this._bounds
  }

  public draw(context: CanvasRenderingContext2D): void {
    context.save()
    context.globalAlpha = 0.5

    context.fillStyle = "red"
    context.beginPath()
    context.moveTo(this.points[0].x, this.points[0].y)
    this.points.forEach((point) => context.lineTo(point.x, point.y))
    context.closePath()
    context.stroke()
    context.fill()

    context.restore()

    drawOriginPoint(context, this.originRotate, "rotate")
    drawOriginPoint(context, this.originScale, "scale")
  }
}