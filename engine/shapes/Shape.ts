import { } from "lodash";
import { Group } from "../Group";
import { Layer } from "../Layer";
import { Node, type NodeConfig } from "../Node";
import * as Primitive from "../maths";
import { type PointData } from "../maths";
import { drawOriginPoint } from "../behaviors/Transformable";
import type { EventObject } from "../behaviors/EventBehavior";
import { getPointFromEvent } from "../shared/point";

export interface ShapeConfig extends NodeConfig {
  name?: string | undefined
  fillColor?: string
  strokeColor?: string
  fill?: boolean
  stroke?: boolean
}


export abstract class Shape extends Node {
  public abstract buildPath(context: CanvasRenderingContext2D): void
  public abstract getBounds(): Primitive.Rectangle
  public abstract getPoints(): Array<Primitive.PointData>

  protected readonly _type = "Shape"

  public fillColor: string = "darkorange"
  public strokeColor: string = "black"
  public lineWidth: number = 1
  public stroke: boolean = true
  public fill: boolean = true

  public getParent(): Group | null {
    return super.getParent() as Group | null
  }

  private _startDragPointer = new Primitive.Point()

  public bindEvents() {
    const moveCallback = (event: EventObject<Event>) => {
      event.cancelBubble = false

      const currentPointer = new Primitive.Point().copyFrom(getPointFromEvent(event.evt as PointerEvent))
      const delta = Primitive.Point.subtract(currentPointer, this._startDragPointer)

      this.updateInteraction(delta)
    }

    const upCallback = (event: EventObject<Event>) => {
      this.endInteraction()

      this.off("pointermove", moveCallback)
      this.off("pointerup", upCallback)
    }

    const downCallback = (event: EventObject<Event>) => {
      this.beginInteraction("translate")

      this._startDragPointer.copyFrom(getPointFromEvent(event.evt as PointerEvent))

      this.on("pointermove", moveCallback)
      this.on("pointerup", upCallback)
    }

    this.on("pointerdown", downCallback)
  }

  public render(context: CanvasRenderingContext2D): void {
    const originalBounds = this.getBounds()
    const bounds = originalBounds

    context.save()

    this.bindTransformsToContext(context)
    this.buildPath(context)
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    this.applyMainStyles(context)

    context.restore()

    this.drawOrigins(context)
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    context.save()
    this.bindTransformsToContext(context)
    this.buildPath(context)
    this.applyHitStyles(context)
    context.restore()
  }

  public applyHitStyles(context: CanvasRenderingContext2D): void {
    const layer = this.findAncestor<Layer>((node) => node instanceof Layer)
    if (!layer) return

    const hitColor = layer.getHitColor(this)

    context.fillStyle = hitColor
    context.strokeStyle = hitColor

    if (this.fill) context.fill()
    if (this.stroke || !this.fill) context.stroke()
  }

  public applyMainStyles(context: CanvasRenderingContext2D): void {
    context.lineWidth = this.lineWidth
    context.fillStyle = this.fillColor
    context.strokeStyle = this.strokeColor

    if (this.fill) context.fill()
    if (this.stroke) context.stroke()
  }
}
