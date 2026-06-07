export interface SizeData {
  width: number
  height: number
}

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

  public static fromSize<T extends SizeData>(value: T): Point {
    return new Point(value.width, value.height)
  }

  public static fromData(point: PointData) {
    return new Point(point.x, point.y)
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

  public array(): [number, number] {
    return [this.x, this.y]
  }

  public size(): SizeData {
    return {
      width: this.x,
      height: this.y,
    }
  }

  public floor(): Point {
    return new Point(Math.floor(this.x), Math.floor(this.y))
  }

  public ceil(): Point {
    return new Point(Math.ceil(this.x), Math.ceil(this.y))
  }

  public sign(): Point {
    return new Point(Math.sign(this.x), Math.sign(this.y))
  }
}
