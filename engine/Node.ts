import { isNull } from "lodash"
import { Draggable } from "./behaviors/Draggable"
import type { Group } from "./Group"
import * as Maths from "./maths"
import { addPoint } from "./shared/point"

export abstract class Node extends Draggable {
  public abstract readonly absolutePositionCursor: Maths.PointData

  public abstract contains(point: Maths.PointData): boolean
  public abstract draw(context: CanvasRenderingContext2D): void
  public abstract getClientRect(): Maths.Rectangle

  protected _name: string | undefined = undefined

  public _parent: Group | null = null
  public _position: Maths.PointData = {
    x: 0,
    y: 0,
  }

  public getParent() {
    return this._parent
  }

  public getName() {
    return this._name
  }


  public getAllParents<T extends Node>(list: Array<T> = []): Array<T> {
    const parent = this.getParent() as unknown as T

    return isNull(parent)
      ? list
      : this.getAllParents.call(parent, list.concat(parent)) as Array<T>
  }

  public getAbsolutePosition(): Maths.PointData {
    if (!isNull(this._parent)) {
      const parentPosition = this._parent.getAbsolutePosition()
      return addPoint(parentPosition, this._position)
    }

    return this._position
  }
}