import { } from "lodash";
import { Group } from "../Group";
import { Layer } from "../Layer";
import { Node, type NodeConfig } from "../Node";
import * as Primitive from "../maths";
import { Point, type PointData } from "../maths";
import { Transformable } from "../behaviors/Transformable"

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

/**
  private _bindEvents() {
  const moveCallback = (event: KonvaEventObject<Event>) => {
    // console.log("MOVE")
  }

  const upCallback = (event: KonvaEventObject<Event>) => {
    // console.log("UP")

    this._shape.off("pointermove", moveCallback)
    this._shape.off("pointerup", upCallback)
  }

  const downCallback = (event: KonvaEventObject<Event>) => {
    // console.log("DOWN")

    this._shape.on("pointermove", moveCallback)
    this._shape.on("pointerup", upCallback)
  }

  this._shape.on("pointerdown", downCallback)

  this.unsubscribe = () => {
    this._shape.off("pointerdown", downCallback)
  }
}
*/

export class Shape extends Node {
  protected readonly _type = "Shape"

  private readonly _bounds = new Primitive.Rectangle()

  public transformer = new Transformable(this)

  public tension: number = 0.1

  public constructor(private readonly _config: PolygonConfig) {
    super(_config)

    const filledConfing = fillConfigDefaultValues(_config)
    Object.assign(this._config, filledConfing)

    this.points = filledConfing.points

    this.transformer.initialize()
  }

  public getParent(): Group | null {
    return super.getParent() as Group | null
  }

  public getPoints(): Array<PointData> {
    return this.points.map((point) => ({ ...point }))
  }

  public getClientRect(): Primitive.Rectangle {
    this.getBounds(this._bounds)
    Point.add(this._bounds, this.getPosition(), this._bounds)
    return this._bounds
  }

  public draw(context: CanvasRenderingContext2D): void {
    context.save()
    this.transformer.bindTransformsToContext(context)

    this._drawPolygon(context)
    this._applyStyles(context)

    context.restore()

    this.transformer.render(context)

  }

  public drawHit(context: CanvasRenderingContext2D): void {
    const layer = this.findAncestor<Layer>((node) => node instanceof Layer)
    if (!layer) return

    const hitColor = layer.getHitColor(this)

    context.save()
    this._drawPolygon(context)

    context.fillStyle = hitColor
    context.strokeStyle = hitColor

    if (this._config.fill) context.fill()
    if (this._config.stroke || !this._config.fill) context.stroke()

    context.restore()
  }

  private _applyStyles(context: CanvasRenderingContext2D): void {
    const config = this._config

    if (config.fill && config.fillColor) {
      context.fillStyle = config.fillColor
      context.fill()
    }

    if (config.stroke && config.strokeColor) {
      context.strokeStyle = config.strokeColor
      context.stroke()
    }
  }

  private _drawPolygon(context: CanvasRenderingContext2D): void {
    const length = this.points.length

    context.beginPath()

    if (length < 3 || this.tension === 0) {
      context.moveTo(this.points[0].x, this.points[0].y)
      this.points.forEach(point => context.lineTo(point.x, point.y))
      context.closePath()
      return
    }

    context.moveTo(this.points[0].x, this.points[0].y)

    for (let i = 0; i < length; i++) {
      const p0 = this.points[(i - 1 + length) % length]
      const p1 = this.points[i]
      const p2 = this.points[(i + 1) % length]
      const p3 = this.points[(i + 2) % length]

      const cp1x = p1.x + (p2.x - p0.x) * this.tension
      const cp1y = p1.y + (p2.y - p0.y) * this.tension
      const cp2x = p2.x - (p3.x - p1.x) * this.tension
      const cp2y = p2.y - (p3.y - p1.y) * this.tension

      context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }

    context.closePath()
  }
}
