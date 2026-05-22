import type { EventObject } from "../behaviors/EventBehavior";
import { Group } from "../Group";
import { Layer } from "../Layer";
import { Rectangle, Point, type PointData } from "../maths";
import { Node, type NodeConfig } from "../Node";
import { getPointFromEvent, pointFromEvent } from "../shared/point";
import { Stage } from "../Stage";

export interface ShapeConfig extends NodeConfig {
  name?: string | undefined
  fillColor?: string
  strokeColor?: string
  fill?: boolean
  stroke?: boolean
}


export abstract class Shape extends Node {
  public abstract buildPath(context: CanvasRenderingContext2D): void
  public abstract getBounds(): Rectangle
  public abstract getPoints(): Array<PointData>
  public abstract contains(x: number, y: number): boolean

  protected readonly _type = "Shape"

  public fillColor: string = "darkorange"
  public strokeColor: string = "black"
  public lineWidth: number = 1
  public stroke: boolean = true
  public fill: boolean = true

  public getParent(): Group | null {
    return super.getParent() as Group | null
  }

  public getStage(): Stage | null {
    return this.findAncestor((node) => node.getType() === "Stage") as Stage | null
  }

  private _startDragPointer = Point.zero()

  public bindEvents() {
    const moveCallback = (event: EventObject<Event>) => {
      event.cancelBubble = false

      const currentPointer = pointFromEvent(event.evt as PointerEvent)
      const delta = currentPointer.sub(this._startDragPointer)

      this.updateInteraction(delta)
    }

    const upCallback = (event: EventObject<Event>) => {
      const stage = this.getStage()

      if (stage) {
        this.endInteraction()

        stage.off("pointermove", moveCallback)
        stage.off("pointerup", upCallback)
      }
    }

    const downCallback = (event: EventObject<Event>) => {
      const stage = this.getStage()

      if (stage) {
        this.beginInteraction("translate")
        this._startDragPointer.copyFrom(getPointFromEvent(event.evt as PointerEvent))

        stage.on("pointermove", moveCallback)
        stage.on("pointerup", upCallback)
      }
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
