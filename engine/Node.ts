import { isNull } from "lodash"
import { nanoid } from "nanoid"
import { Draggable } from "./behaviors/Draggable"
import * as Primitive from "./maths"
import { addPoint, multiplePoint } from "./shared/point"
import { Mixin } from "ts-mixer"
import { Transformable } from "./behaviors/Transformable"

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

export abstract class Node extends Mixin(Primitive.Polygon, Transformable) {
  private readonly _id = nanoid()

  public abstract readonly absolutePositionCursor: Primitive.PointData

  protected readonly abstract _type: string
  protected _name: string | undefined = undefined

  public readonly drag = new Draggable(this)

  public abstract draw(context: CanvasRenderingContext2D): void
  public abstract getClientRect(): Primitive.Rectangle
  public abstract getPoints(): Array<Primitive.PointData>

  public getType(): string {
    return this._type
  }

  private _isDraggable: boolean = true
  private _parent: Node | null = null

  private _position = new Primitive.Point()
  private _scale = new Primitive.Point()
  private _angle: number = 0

  public constructor(params: NodeConfig) {
    super([])

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

  public getName() {
    return this._name
  }

  public setAngle(angle: number) {
    this._angle = angle
  }

  public getAngle() {
    return this._angle
  }

  public getIsDraggable() {
    return this._isDraggable
  }

  public setIsDraggable(enable: boolean) {
    this._isDraggable = enable

    if (enable) this.drag.subscribe()
    else this.drag.unsubscribe()
  }

  public setPosition(point: Primitive.PointData) {
    this._position.set(point.x, point.y)
  }

  public getPosition() {
    return this._position
  }

  public setScale(point: Primitive.PointData) {
    this._scale.set(point.x, point.y)
  }

  public getScale() {
    return this._scale
  }

  public setParent(node: Node) {
    this._parent = node
  }

  public getParent() {
    return this._parent
  }

  public getAllParents<T extends Node>(list: Array<T> = []): Array<T> {
    const parent = this.getParent() as unknown as T

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

  private readonly _listenersMap: Map<string, Array<(event: any) => void>> = new Map()

  public on(eventName: string, callback: (event: any) => void): void {
    const listeners = this._listenersMap.get(eventName)

    if (listeners) listeners.push(callback)
    else this._listenersMap.set(eventName, [callback])
  }

  public fire(eventName: string, event: any): void {
    const listeners = this._listenersMap.get(eventName)

    if (listeners) {
      listeners.forEach((listener) => {
        listener(event)
      })
    }
  }
}