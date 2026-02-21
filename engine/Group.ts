import { Node, type NodeConfig } from "./Node";
import type { Observable } from "./shared/Observer";
import * as Primitive from "./maths"
import { defaultTo, isUndefined } from "lodash";

interface GroupConfig extends NodeConfig {
  name?: string
  x: number
  y: number
}

export class Group extends Node implements Observable {
  private readonly _type = "Group" as const

  private _children: Array<Node> = []

  private readonly _clientRect: Primitive.Rectangle = new Primitive.Rectangle()

  public readonly absolutePositionCursor: Primitive.PointData = {
    x: 0,
    y: 0,
  }

  public constructor(config?: GroupConfig) {
    super()

    if (defaultTo(config?.isDraggable, true)) {
      this.attach(this)
      this.init(this)
    }

    if (!isUndefined(config)) {
      this.position(config)

      this._name = config.name
    }
  }

  public update(): void {
    this._needUpdate = true
  }

  public getType() {
    return this._type
  }

  public draw(context: CanvasRenderingContext2D): void {
    this.__debugDrawBounds(context)

    context.save()

    context.translate(this.position().x, this.position().y)
    this._children.forEach((child) => child.draw(context))

    context.restore()
  }

  public contains(point: Primitive.PointData): boolean {
    return this._clientRect.contains(point.x, point.y)
  }

  public getRelativePointerPosition() {
    const absolutePosition = this.getAbsolutePosition()

    return {
      x: this.absolutePositionCursor.x - absolutePosition.x,
      y: this.absolutePositionCursor.y - absolutePosition.y,
    }
  }

  public getClientRect(): Primitive.Rectangle {
    if (this._needUpdate) {
      this._needUpdate = false

      const corners = this._children.flatMap((child) => (
        child
          .getClientRect()
          .getCorner()
      ))

      new Primitive.Polygon(corners).getBounds(this._clientRect)

      this._clientRect.x += this.position().x
      this._clientRect.y += this.position().y
    }

    return this._clientRect
  }

  public add(...children: Array<Node>) {
    children.forEach((child) => {
      this._children.push(child)

      child.parent(this)
    })
  }

  public getChildren() {
    return this._children
  }

  private __debugDrawBounds(context: CanvasRenderingContext2D) {
    const bounds = this.getClientRect()

    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}