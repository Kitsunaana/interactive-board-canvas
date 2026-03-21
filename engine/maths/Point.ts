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
  constructor(public x: number = 0, public y: number = 0) { }

  public clone(): Point {
    return new Point(this.x, this.y)
  }

  public copyFrom(point: Point): this {
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

  static rotate(point: PointData, angle: number, out?: PointData) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    out ||= new Point()

    out.x = point.x * cos - point.y * sin
    out.y = point.x * sin + point.y * cos

    return out
  }

  static substract(pointA: PointData, pointB: PointData, out?: PointData) {
    out ||= new Point()

    out.x = pointA.x - pointB.x
    out.y = pointA.y - pointB.y

    return out
  }

  static multiple(pointA: PointData, pointB: PointData, out?: PointData) {
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
}