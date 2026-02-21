import { isNull, isUndefined } from "lodash"
import { Draggable } from "./behaviors/Draggable"
import * as Primitive from "./maths"
import { addPoint, multiplePoint } from "./shared/point"

export interface NodeConfig {
  isDraggable?: boolean

  x?: number
  y?: number
  scaleX?: number
  scaleY?: number
}

export abstract class Node extends Draggable {
  public abstract readonly absolutePositionCursor: Primitive.PointData

  public abstract contains(point: Primitive.PointData): boolean
  public abstract draw(context: CanvasRenderingContext2D): void
  public abstract getClientRect(): Primitive.Rectangle

  protected _name: string | undefined = undefined
  protected _needUpdate: boolean = true

  private _parent: Node | null = null

  private _position = new Primitive.ObservablePoint({
    _onUpdate: this._onUpdate.bind(this)
  })

  private _scale = new Primitive.ObservablePoint({
    _onUpdate: this._onUpdate.bind(this)
  })

  private _onUpdate() {
    this._needUpdate = true
    this._notifyParent()
  }

  public position(): Primitive.ObservablePoint
  public position(point: Primitive.PointData): void
  public position(point?: Primitive.PointData) {
    if (isUndefined(point))
      return this._position

    this._position.x = point.x
    this._position.y = point.y
  }

  public scale(): Primitive.ObservablePoint
  public scale(point: Primitive.PointData): void
  public scale(point?: Primitive.PointData) {
    if (isUndefined(point))
      return this._scale

    this._scale.x = point.x
    this._scale.y = point.y
  }

  public parent(): Node
  public parent(node: Node): void
  public parent(node?: Node) {
    if (isUndefined(node))
      return this._parent

    this._parent = node
  }

  public getName() {
    return this._name
  }

  public startDrag(): void {
    super.startDrag()
    this._notifyParent()
  }

  public stopDrag(): void {
    super.stopDrag()
    this._notifyParent()
  }

  private _notifyParent(): void {
    this.getAllParents().forEach((parent) => {
      parent._needUpdate = true
    })
  }

  public getAllParents<T extends Node>(list: Array<T> = []): Array<T> {
    const parent = this.parent() as unknown as T

    return isNull(parent)
      ? list
      : this.getAllParents.call(parent, list.concat(parent)) as Array<T>
  }

  public getRelativePointerPosition() {
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