import { Transformable, drawOriginPoint } from "../behaviors/Transformable"
import { Mixin } from "ts-mixer";
import { Node, type NodeConfig } from "../Node";
import * as Primitive from "../maths";
import { Point } from "../maths";
import { } from "lodash";

export interface PolygonConfig extends NodeConfig {
  points: Primitive.PointData[],
  name?: string | undefined
  fillColor?: string
  strokeColor?: string
  fill?: boolean
  stroke?: boolean
}

function fillConfigDefaultValues(config: PolygonConfig) {
  const { x, y, scaleX, scaleY, ...other } = config

  return {
    isDraggable: false,
    position: new Point(x ?? 0, y ?? 0),
    scale: new Point(scaleX ?? 1, scaleY ?? 1),
    strokeColor: "black",
    stroke: true,
    ...other,
  }
}

export class Polygon extends Mixin(Node, Transformable) {
  protected readonly _type = "Shape" as const

  private readonly _bounds = new Primitive.Rectangle()


  public needDrawOriginPoints = false

  public get absolutePositionCursor() {
    return this.getParent()!.absolutePositionCursor
  }

  public constructor(private readonly config: PolygonConfig) {
    super(config)

    const filledConfing = fillConfigDefaultValues(config)
    Object.assign(this.config, filledConfing)

    this.points = filledConfing.points

    this.setOriginScale({ x: 0.5, y: 0.5 }, "rotate")
    this.setOriginScale({ x: 0.5, y: 0.5 }, "scale")
  }

  public getPoints(): Array<Primitive.PointData> {
    return this.points.map((point) => ({ ...point }))
  }

  public rotate(angle: number) {
    this.setAngle(this.getAngle() + angle)

    this.points.forEach((point) => {
      const next = Primitive.rotatePointAroundOrigin(point, this.origins.rotate, angle)

      point.x = next.x
      point.y = next.y
    })

    this.updateOriginScalePosition(angle)
  }

  public scale(value: Primitive.PointData) {
    this.setScale(Point.multiple(this.getScale(), value))

    const angle = this.getAngle()

    this.points.forEach((point) => {
      const unrotated = Primitive.rotatePointAroundOrigin(point, this.origins.scale, -angle)
      const scaled = Primitive.scalePointAroundOrigin(unrotated, this.origins.scale, value)
      const rotated = Primitive.rotatePointAroundOrigin(scaled, this.origins.scale, angle)

      point.x = rotated.x
      point.y = rotated.y
    })

    this.updateOriginRotatePosition(value)
  }

  public getClientRect(): Primitive.Rectangle {
    this.getBounds(this._bounds)
    Point.add(this._bounds, this.getPosition(), this._bounds)
    return this._bounds
  }

  public applyStyles(context: CanvasRenderingContext2D) {
    const config = this.config

    if (config.fill && config.fillColor) {
      context.fillStyle = config.fillColor
      context.fill()
    }

    if (config.stroke && config.strokeColor) {
      context.strokeStyle = config.strokeColor
      context.stroke()
    }
  }

  public draw(context: CanvasRenderingContext2D): void {
    context.save()
    context.beginPath()
    context.moveTo(this.points[0].x, this.points[0].y)
    this.points.forEach((point) => context.lineTo(point.x, point.y))
    context.closePath()

    this.applyStyles(context)

    context.restore()

    if (this.needDrawOriginPoints) {
      drawOriginPoint(context, this.origins.rotate, "rotate")
      drawOriginPoint(context, this.origins.scale, "scale")
    }
  }
}