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

  static subtract(pointA: PointData, pointB: PointData, out?: PointData) {
    out ||= new Point()

    out.x = pointA.x - pointB.x
    out.y = pointA.y - pointB.y

    return out
  }

  static divide(pointA: PointData, pointB: PointData, out?: PointData) {
    out ||= new Point()

    out.x = pointA.x / pointB.x
    out.y = pointA.y / pointB.y

    return out
  }

  static multiply(pointA: PointData, pointB: PointData, out?: PointData) {
    out ||= new Point()

    out.x = pointA.x * pointB.x
    out.y = pointA.y * pointB.y

    return out
  }

  static add(pointA: PointData, pointB: PointData, out?: PointData) {
    out ||= new Point()

    out.x = pointA.x + pointB.x
    out.y = pointA.y + pointB.y

    return out
  }

  static length(point: PointData): number {
    return Math.hypot(point.x, point.y)
  }
}
