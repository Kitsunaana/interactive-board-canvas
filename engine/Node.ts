import { isNull, isUndefined } from "lodash"
import { nanoid } from "nanoid"
import { Draggable } from "./behaviors/Draggable"
import * as Primitive from "./maths"
import { addPoint, multiplePoint } from "./shared/point"

export interface NodeConfig {
  isDraggable?: boolean
  scaleX?: number
  scaleY?: number
  name?: string
  x?: number
  y?: number
}

export const fillConfigDefaultValues = (config: NodeConfig) => ({
  isDraggable: true,
  name: undefined,
  scaleX: 1,
  scaleY: 1,
  x: 0,
  y: 0,

  ...config,
})

export abstract class Node {
  private readonly _id = nanoid()

  public abstract readonly absolutePositionCursor: Primitive.PointData

  public abstract contains(point: Primitive.PointData): boolean
  public abstract draw(context: CanvasRenderingContext2D): void
  public abstract getClientRect(): Primitive.Rectangle
  public abstract getType(): string

  protected _name: string | undefined = undefined

  public readonly drag = new Draggable(this)

  private _isDraggable: boolean = true
  private _parent: Node | null = null

  private _position = new Primitive.Point()
  private _scale = new Primitive.Point()
  private _angle: number = 0

  public constructor(params: NodeConfig) {
    const config = fillConfigDefaultValues(params)

    this._isDraggable = config.isDraggable
    this._name = config.name

    this._scale.set(config.scaleX, config.scaleY)
    this._position.set(config.x, config.y)

    if (config.isDraggable) {
      this.drag.subscribe()
    }
  }

  public get id(): string {
    return this._id
  }

  public get angle(): number {
    return this._angle
  }

  public rotate(angle: number): void {
    this._angle = angle
  }

  public getName() {
    return this._name
  }

  public isDraggable(): boolean
  public isDraggable(enable: boolean): void
  public isDraggable(enable?: boolean): boolean | void {
    if (isUndefined(enable)) return this._isDraggable

    this._isDraggable = enable

    if (enable) this.drag.subscribe()
    else this.drag.unsubscribe()
  }

  public position(): Primitive.Point
  public position(point: Primitive.PointData): void
  public position(point?: Primitive.PointData): Primitive.Point | void {
    if (isUndefined(point)) return this._position
    this._position.set(point.x, point.y)
  }

  public scale(): Primitive.Point
  public scale(point: Primitive.PointData): void
  public scale(point?: Primitive.PointData): Primitive.Point | void {
    if (isUndefined(point)) return this._scale
    this._scale.set(point.x, point.y)
  }

  public parent(): Node | null
  public parent(node: Node): void
  public parent(node?: Node): Node | null | void {
    if (isUndefined(node)) return this._parent
    this._parent = node
  }

  public getAllParents<T extends Node>(list: Array<T> = []): Array<T> {
    const parent = this.parent() as unknown as T

    return isNull(parent)
      ? list
      : this.getAllParents.call(parent, list.concat(parent)) as Array<T>
  }

  public getRelativePointerPosition(): Primitive.PointData {
    const absolutePosition = this.getAbsolutePosition()
    const absoluteScale = this.getAbsoluteScale()

    return {
      x: (this.absolutePositionCursor.x - absolutePosition.x) / absoluteScale.x,
      y: (this.absolutePositionCursor.y - absolutePosition.y) / absoluteScale.y,
    }
  }

  public getAbsoluteScale(): Primitive.PointData {
    if (this._parent) {
      const parentScale = this._parent.getAbsoluteScale()
      return multiplePoint(parentScale, this._scale)
    }

    return {
      x: this._scale.x,
      y: this._scale.y,
    }
  }

  public getAbsolutePosition(): Primitive.PointData {
    if (this._parent) {
      const parentPosition = this._parent.getAbsolutePosition()
      const parentScale = this._parent.getAbsoluteScale()

      return addPoint(parentPosition, multiplePoint(this._position, parentScale))
    }

    return {
      x: this._position.x,
      y: this._position.y,
    }
  }
}