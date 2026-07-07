import { nanoid } from "nanoid"
import { Mixin } from "ts-mixer"
import { EventBehavior, type EventObject } from "../behaviors/EventBehavior"
import { Circle } from "../maths"
import { Stage } from "../Stage"
import { SimObject } from "../world/sim-object"
import { BaseShapeComponent } from "./base-shape-component"

const sources = {
  // darthVader: 'https://konvajs.org/assets/darth-vader.jpg',
  darthVader: 'https://i.pinimg.com/originals/02/25/2e/02252e85fef76ab07d9536d39056cead.jpg',
  yoda: 'https://konvajs.org/assets/yoda.jpg',
}

export class CircleComponent extends Mixin(BaseShapeComponent, EventBehavior) {
  public readonly id: string = nanoid()

  public geometry: Circle

  public constructor(public x: number, public y: number, public radius: number) {
    super()

    this.geometry = new Circle(x, y, radius)
    
    this._handleStartDrag = this._handleStartDrag.bind(this)
    this._handleMoveDrag = this._handleMoveDrag.bind(this)
    this._handleEndDrag = this._handleEndDrag.bind(this)

    this.on("pointerdown", this._handleStartDrag)
  }

  private _handleStartDrag() {
    const stage = this.owner?.layer()?.stage()

    stage?.on("pointermove", this._handleMoveDrag)
    stage?.on("pointerup", this._handleEndDrag)

    this.fire("dragstart")
  }

  private _handleMoveDrag(event: EventObject<Stage>) {
    const stage = this.owner?.layer()?.stage()
    const cursor = stage!.absolutePositionCursor

    this.x = cursor.x
    this.y = cursor.y

    this.fire("dragmove")
  }

  private _handleEndDrag(event: EventObject<Stage>) {
    const stage = this.owner?.layer()?.stage()

    stage?.off("pointermove", this._handleMoveDrag)
    stage?.off("pointerup", this._handleEndDrag)

    this.fire("dragend")
  }

  public getParent(): SimObject | null {
    return this.owner?.parent() ?? null
  }

  public getAllParents() {
    if (this.owner) return this.owner.getAllParents()
    return []
  }

  public update(time: number): void { }

  public render(context: CanvasRenderingContext2D): void {
    context.beginPath()
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    // context.closePath()

    context.stroke()
    context.fill()
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    context.beginPath()
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    // context.closePath()

    const layer = this.owner?.layer()

    if (this.owner && layer) {
      const hitColor = layer.getHitColor(this)

      context.strokeStyle = hitColor
      context.fillStyle = hitColor

      context.fill()
      context.stroke()
    }
  }
}