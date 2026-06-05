import { type PointData, Rectangle } from "../maths";
import { SimObject } from "../world/sim-object";

export abstract class BaseComponent {
  public abstract getBounds(): Rectangle
  public abstract getCorners(): Array<PointData>

  public abstract update(time: number): void
  public abstract render(context: CanvasRenderingContext2D): void
  public abstract renderHit(context: CanvasRenderingContext2D): void
  public abstract applyMainStyles(context: CanvasRenderingContext2D): void

  protected _owner: SimObject | null = null

  public get owner(): SimObject | null {
    return this._owner
  }

  public setOwner(owner: SimObject): void {
    this._owner = owner
  }
}