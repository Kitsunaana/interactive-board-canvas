import { isEmpty, isNull, isUndefined } from "lodash";
import { nanoid } from "nanoid";
import { Mixin } from "ts-mixer";
import { EventBehavior } from "../behaviors/EventBehavior";
import { Transformable } from "../behaviors/Transformable";
import type { Layer } from "../Layer";
import { Matrix3x3, type PointData, Rectangle } from "../maths";

export type GetBoundsParams = {
  skipWorldTransform?: boolean
  skipTransform?: boolean
}

export abstract class SimObject extends Mixin(Transformable, EventBehavior) {
  public abstract getBounds(params?: GetBoundsParams): Rectangle

  protected _children: Array<SimObject> = []
  protected _parent: SimObject | null = null
  protected _layer: Layer | null = null

  public id: string = nanoid()

  protected _localMatrix: Matrix3x3 = Matrix3x3.identity()
  protected _worldMatrix: Matrix3x3 = Matrix3x3.identity()

  public getCorners(): Array<PointData> {
    const matrix = this.computeMatrix()

    return this
      .getBounds()
      .getCorners()
      .map((point) => matrix.applyToPoint(point))
  }

  public computeWorldMatrix() {
    const parents = this.getAllParents()

    return parents.reduce(
      (accMatrix, object) => {
        const matrix = object.computeMatrix()
        
        return Matrix3x3.compose(accMatrix, matrix)
      }, 
      Matrix3x3.identity()
    )
  }

  public children(): Array<SimObject>
  public children(...list: Array<SimObject>): void
  public children(...list: Array<SimObject>): Array<SimObject> | void {
    if (isEmpty(list)) return this._children

    list.forEach((child) => {
      this._children.push(child)
      child.parent(this)
    })
  }

  public parent(): SimObject | null
  public parent(parent: SimObject): void
  public parent(parent?: SimObject): SimObject | null | void {
    if (isUndefined(parent)) return this._parent
    this._parent = parent
  }

  public layer(): Layer | null
  public layer(layer: Layer): void
  public layer(layer?: Layer): Layer | null | void {
    if (isUndefined(layer)) return this._layer

    this._layer = layer
    this._children.forEach((child) => child.layer(layer))
  }

  public getAllParents<T extends SimObject>(list: Array<T> = []): Array<T> {
    const parent = this.parent() as unknown as T

    return isNull(parent)
      ? list
      : this.getAllParents.call(parent, list.concat(parent)) as Array<T>
  }

  public render(context: CanvasRenderingContext2D): void {
    this._children.forEach((child) => {
      context.save()
      child.render(context)
      context.restore()
    })
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    this._children.forEach((child) => {
      context.save()
      child.renderHit(context)
      context.restore()
    })
  }
}

