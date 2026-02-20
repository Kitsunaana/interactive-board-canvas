import { clone, isNull } from "lodash";
import { addPoint, subtractPoint } from "../../point";
import { isNotNull, isNotUndefined } from "../../utils";
import { Polygon, Rectangle, type PointData } from "../math";
import { createDragEventsFlow } from "../transformer/v2/shared";

interface Shape extends Node {
  _parent: Group | null

  getType(): "Shape"
  draw(context: CanvasRenderingContext2D): void
  getClientRect(): Rectangle
}

type AvailableChild = Group | Shape

interface GroupConfig {
  x: number
  y: number

  name?: string
}

export interface Observerable {
  update(): void
}

export class Observer {
  private _observers: Array<Observerable> = []

  public attach(observer: Observerable) {
    const isExist = this._observers.includes(observer)
    if (isExist) return

    this._observers.push(observer)
  }

  public detach(observer: Observerable) {
    const index = this._observers.indexOf(observer)
    if (index === -1) return

    this._observers.splice(index, 1)
  }

  public notify() {
    this._observers.forEach((observer) => {
      observer.update()
    })
  }
}

export interface Node {
  _position: PointData
  absolutePositionCursor: PointData

  getAbsolutePosition(): PointData
  getParent(): Group | null
  contains(point: PointData): boolean
}

export abstract class Draggable extends Observer {
  private _startDragPosition: PointData | null = null
  private _startDragPointer: PointData | null = null

  private _isDragging: boolean = false

  public isDragging() {
    return this._isDragging
  }

  public startDrag() {
    this._isDragging = true
  }

  public stopDrag() {
    this._isDragging = false
  }

  public init(node: NodeV3) {
    createDragEventsFlow({
      guard: this._canStartDrag.bind(this, node),

      process: this._processDrag.bind(this, node),
      finish: this._finishDrag.bind(this),
      start: this._startDrag.bind(this, node),
    })
  }

  private _finishDrag() {
    this._startDragPointer = null
    this._startDragPosition = null

    this.stopDrag()
    this.notify()
  }

  private _processDrag(node: NodeV3) {
    if (this.isDragging() && isNotNull(this._startDragPointer) && isNotNull(this._startDragPosition)) {
      const offset = subtractPoint(this._startDragPointer, node.absolutePositionCursor)

      node._position = addPoint(this._startDragPosition, offset)
    }
  }

  private _startDrag(node: NodeV3) {
    this._startDragPointer = clone(node.absolutePositionCursor)
    this._startDragPosition = clone(node._position)

    node
      .getAllParents()
      .forEach((parent) => parent.stopDrag())

    this.startDrag()
    this.notify()
  }

  private _canStartDrag(node: NodeV3) {
    const absolutePosition = node.getAbsolutePosition()

    const positionWithoutOwnShift = subtractPoint(node._position, absolutePosition)
    const cursorPositionInClientRect = subtractPoint(positionWithoutOwnShift, node.absolutePositionCursor)

    return node.contains(cursorPositionInClientRect)
  }
}

export abstract class NodeV3 extends Draggable {
  public abstract readonly absolutePositionCursor: PointData
  public abstract contains(point: PointData): boolean

  protected _name: string | undefined = undefined

  public _parent: Group | null = null
  public _position: PointData = {
    x: 0,
    y: 0,
  }

  public getParent() {
    return this._parent
  }

  public getName() {
    return this._name
  }

  public getAbsolutePosition(): PointData {
    if (isNotNull(this._parent)) {
      const parentPosition = this._parent.getAbsolutePosition()
      return addPoint(parentPosition, this._position)
    }

    return this._position
  }

  public getAllParents<T extends NodeV3>(list: Array<T> = []): Array<T> {
    const parent = this.getParent() as unknown as T

    return isNull(parent)
      ? list
      : this.getAllParents.call(parent, list.concat(parent)) as Array<T>
  }
}

export class Group extends NodeV3 implements Observerable {
  private readonly _type = "Group" as const

  private _children: Array<AvailableChild> = []
  private _needUpdateClientRect: boolean = true

  private readonly _clientRect: Rectangle = new Rectangle()

  public readonly absolutePositionCursor: PointData = {
    x: 0,
    y: 0,
  }

  public constructor(config?: GroupConfig) {
    super()

    this.init(this)
    this.attach(this)

    if (isNotUndefined(config)) {
      this._position.x = config.x
      this._position.y = config.y
      this._name = config.name
    }
  }

  public update(): void {
    this._needUpdateClientRect = true
  }

  public getType() {
    return this._type
  }

  public draw(context: CanvasRenderingContext2D): void {
    this.__debugDrawBounds(context)

    context.save()

    context.translate(this._position.x, this._position.y)
    this._children.forEach((child) => child.draw(context))

    context.restore()
  }

  public contains(point: PointData): boolean {
    return this._clientRect.contains(point.x, point.y)
  }

  public getRelativePointerPosition() {
    const absolutePosition = this.getAbsolutePosition()

    return {
      x: this.absolutePositionCursor.x - absolutePosition.x,
      y: this.absolutePositionCursor.y - absolutePosition.y,
    }
  }

  public getClientRect(): Rectangle {
    if (this._needUpdateClientRect) {
      this._needUpdateClientRect = false

      const corners = this._children.flatMap((child) => (
        child
          .getClientRect()
          .getCorner()
      ))

      new Polygon(corners).getBounds(this._clientRect)

      this._clientRect.x += this._position.x
      this._clientRect.y += this._position.y
    }

    return this._clientRect
  }

  public add(...children: Array<AvailableChild>) {
    children.forEach((child) => {
      this._children.push(child)

      child._parent = this
    })
  }

  private __debugDrawBounds(context: CanvasRenderingContext2D) {
    const bounds = this.getClientRect()

    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}