export interface PointData {
  x: number
  y: number
}

export interface PointLike {
  copyFrom(point: PointData): this
  copyTo<T extends PointLike>(point: T): T
  equals(point: PointData): boolean
  set(x: number, y: number): void
}

export class Point implements PointLike {
  public static zero(): Point {
    return new Point(0, 0)
  }

  public static one(): Point {
    return new Point(1, 1)
  }

  public constructor(public x: number = 0, public y: number = 0) { }

  public clone(): Point {
    return new Point(this.x, this.y)
  }

  public copyFrom(point: PointData): this {
    this.set(point.x, point.y)

    return this
  }

  public copyTo<T extends PointLike>(point: T): T {
    point.set(this.x, this.y)

    return point
  }

  public equals(point: PointData): boolean {
    return (point.x === this.x) && (point.y === this.y)
  }

  public set(x = 0, y: number = x): this {
    this.x = x
    this.y = y

    return this
  }

  public sub(point: PointData): Point {
    return new Point(this.x - point.x, this.y - point.y)
  }

  public div(point: PointData): Point {
    return new Point(this.x / point.x, this.y / point.y)
  }

  public mul(point: PointData): Point {
    return new Point(this.x * point.x, this.y * point.y)
  }

  public add(point: PointData): Point {
    return new Point(this.x + point.x, this.y + point.y)
  }

  public scale(value: number): Point {
    return new Point(this.x * value, this.y * value)
  }

  public length(): number {
    return Math.hypot(this.x, this.y)
  }

  public opposite() {
    return new Point(-this.x, -this.y)
  }
}
