import { Node, type NodeConfig } from "./Node";
import type { Observable } from "./shared/Observer";
import * as Primitive from "./maths"
import { defaultTo, isUndefined } from "lodash";

interface GroupConfig extends NodeConfig {
  name?: string
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
      this._name = config.name

      this.position({
        x: config.x ?? 0,
        y: config.y ?? 0,
      })

      this.scale({
        x: config.scaleX ?? 1,
        y: config.scaleY ?? 1,
      })
    }
  }

  public update(): void {
    this._needUpdate = true
  }

  public getType() {
    return this._type
  }

  public contains(point: Primitive.PointData): boolean {
    return this.getClientRect().contains(point.x, point.y)
  }

  public getClientRect(): Primitive.Rectangle {
    if (true) {
      this._needUpdate = false

      const corners = this._children.flatMap((child) => (
        child
          .getClientRect()
          .getCorner()
      ))

      new Primitive.Polygon(corners).getBounds(this._clientRect)

      const scale = this.scale()

      this._clientRect.x = this._clientRect.x * scale.x + this.position().x
      this._clientRect.y = this._clientRect.y * scale.y + this.position().y
      this._clientRect.width *= scale.x
      this._clientRect.height *= scale.y
    }

    return this._clientRect
  }

  public add(...children: Array<Node>) {
    children.forEach((child) => {
      this._children.push(child)

      child.parent(this)
    })
  }

  public getChildren(deep: boolean = false) {
    return this._children
  }

  public draw(context: CanvasRenderingContext2D): void {
    this.__debugDrawBounds(context)

    context.save()

    context.translate(this.position().x, this.position().y)
    context.scale(this.scale().x, this.scale().y)
    
    this._children.forEach((child) => child.draw(context))

    context.restore()
  }

  private __debugDrawBounds(context: CanvasRenderingContext2D) {
    const bounds = this.getClientRect()

    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}