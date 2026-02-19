import { clone, isNull } from "lodash";
import { addPoint, subtractPoint } from "../../point";
import { isNotNull, isNotUndefined } from "../../utils";
import { Polygon, Rectangle, type PointData } from "../math";
import { createDragEventsFlow } from "../transformer/v2/shared";

interface Shape extends Node {
  __parent: Group | null

  getType(): "Shape"
  draw(context: CanvasRenderingContext2D): void
  getClientRect(): Rectangle

  __onUpdate(callback: () => void): void
}

type AvailableChild = Group | Shape

interface GroupConfig {
  x: number
  y: number

  name?: string
}

export class Container {

}

export abstract class Draggable {
  public abstract readonly absolutePositionCursor: PointData

  public abstract position: PointData

  public abstract contains(point: PointData): boolean
  public abstract getAbsolutePosition(): PointData

  private _startDragPosition: PointData | null = null
  private _startDragPointer: PointData | null = null

  private _isDragging: boolean = false

  constructor() {
    const that = this

    createDragEventsFlow({
      guard: this._canStartDrag.bind(that),

      process: this._processDrag.bind(that),
      finish: this._finishDrag.bind(that),
      start: this._startDrag.bind(that),
    })
  }

  public isDragging() {
    return this._isDragging
  }

  public startDrag() {
    this._isDragging = true
  }

  public stopDrag() {
    this._isDragging = false
  }

  private _finishDrag() {
    this._startDragPointer = null
    this._startDragPosition = null
  }

  private _canStartDrag() {
    const absolutePosition = this.getAbsolutePosition()

    const positionWithoutOwnShift = subtractPoint(this.position, absolutePosition)
    const cursorPositionInClientRect = subtractPoint(positionWithoutOwnShift, this.absolutePositionCursor)

    return this.contains(cursorPositionInClientRect)
  }

  private _processDrag() {
    if (this.isDragging() && isNotNull(this._startDragPointer) && isNotNull(this._startDragPosition)) {
      const offset = subtractPoint(this._startDragPointer, this.absolutePositionCursor)

      this.position = addPoint(this._startDragPosition, offset)
    }
  }

  private _startDrag() {
    if (this instanceof Node) {
      Group
        .getAllParentGroups(this)
        .forEach((parent) => parent.stopDrag())
    }

    this._startDragPointer = clone(this.absolutePositionCursor)
    this._startDragPosition = clone(this.position)

    this.startDrag()
  }
}

export abstract class Node extends Draggable {
  public parent: AvailableChild | null = null

  public getParent() {
    return this.parent
  }
}

export class Group extends Node {
  private readonly _name: string | undefined
  private readonly _type = "Group" as const

  private _children: Array<AvailableChild> = []
  private _needUpdateClientRect: boolean = true

  private readonly _clientRect: Rectangle = new Rectangle()
  public readonly position: PointData = {
    x: 0,
    y: 0,
  }

  public readonly absolutePositionCursor: PointData = {
    x: 0,
    y: 0,
  }

  public startDragPosition: PointData | null = null

  public constructor(config?: GroupConfig) {
    super()

    if (isNotUndefined(config)) {
      this.position.x = config.x
      this.position.y = config.y

      this._name = config.name
    }
  }

  public static getAllParentGroups<T extends Node>(group: T, list: Array<T> = []): Array<T> {
    const parent = group.getParent() as unknown as T

    return isNull(parent)
      ? list
      : Group.getAllParentGroups<T>(parent, list.concat(parent))
  }

  private readonly __listeners: Array<Function> = []
  public __onUpdate(callback: () => void): void {
    this.__listeners.push(callback)
  }

  public getType() {
    return this._type
  }

  public draw(context: CanvasRenderingContext2D): void {
    this.__debugDrawBounds(context)

    context.save()

    context.translate(this.position.x, this.position.y)
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

  public getAbsolutePosition(): PointData {
    if (isNotNull(this.parent)) {
      const parentPosition = this.parent.getAbsolutePosition()
      return addPoint(parentPosition, this.position)
    }

    return this.position
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

      this._clientRect.x += this.position.x
      this._clientRect.y += this.position.y
    }

    return this._clientRect
  }

  public add(...children: Array<AvailableChild>) {
    children.forEach((child) => {
      this._children.push(child)
      child.parent = this

      child.__onUpdate(() => {
        this._needUpdateClientRect = true
      })
    })
  }

  private __debugDrawBounds(context: CanvasRenderingContext2D) {
    const bounds = this.getClientRect()

    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}