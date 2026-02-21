import { isNull, isUndefined } from "lodash"
import { Draggable } from "./behaviors/Draggable"
import * as Primitive from "./maths"
import { addPoint } from "./shared/point"

export interface NodeConfig {
  isDraggable?: boolean
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
    _onUpdate: () => {
      this._needUpdate = true
    }
  })

  public position(): Primitive.ObservablePoint
  public position(point: Primitive.PointData): void
  public position(point?: Primitive.PointData) {
    if (isUndefined(point))
      return this._position

    this._position.x = point.x
    this._position.y = point.y
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

    this.getAllParents().forEach((parent) => {
      parent._needUpdate = true
    })
  }

  public stopDrag(): void {
    super.stopDrag()

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

  public getAbsolutePosition(): Primitive.PointData {
    if (!isNull(this._parent)) {
      const parentPosition = this._parent.getAbsolutePosition()
      return addPoint(parentPosition, this._position)
    }

    return this._position
  }
}