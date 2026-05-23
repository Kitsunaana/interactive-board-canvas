import { type PointData, Rectangle } from "../maths";

export abstract class BaseComponent {
  public abstract getBounds(): Rectangle
  public abstract getCorners(): Array<PointData>

  public abstract update(time: number): void
  public abstract render(context: CanvasRenderingContext2D): void
  public abstract renderHit(context: CanvasRenderingContext2D): void
}