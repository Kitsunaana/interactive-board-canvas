import type { Matrix } from "./matrix"
import type { PointData } from "./point"
import { Rectangle } from "./rectangle"

export class Polygon {
  // public points: number[]

  constructor(public points: PointData[]) {
    // this.points = points.flatMap((point) => [point.x, point.y])
  }

  public get lastX(): number {
    return this.points[this.points.length - 1].x
  }

  public get lastY(): number {
    return this.points[this.points.length - 1].y
  }

  public get startX(): number {
    return this.points[0].x
  }

  public get startY(): number {
    return this.points[0].y
  }

  public clone() {
    const points = this.points.map((point) => ({ ...point }))
    const polygon = new Polygon(points)

    return polygon
  }

  public contains(x: number, y: number) {
    let inside = false

    const length = this.points.length

    for (let i = 0, j = length - 1; i < length; j = i++) {
      const xi = this.points[i].x
      const yi = this.points[i].y
      const xj = this.points[j].x
      const yj = this.points[j].y

      const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * ((y - yi) / (yj - yi))) + xi)

      if (intersect) {
        inside = !inside
      }
    }

    return inside
  }

  public getBounds(out?: Rectangle): Rectangle {
    out ||= new Rectangle()

    const points = this.points

    let minX = Infinity
    let maxX = -Infinity

    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0, n = points.length; i < n; i++) {
      const x = points[i].x
      const y = points[i].y

      minX = x < minX ? x : minX
      maxX = x > maxX ? x : maxX

      minY = y < minY ? y : minY
      maxY = y > maxY ? y : maxY
    }

    out.x = minX
    out.width = maxX - minX

    out.y = minY
    out.height = maxY - minY

    return out
  }

  public copyFrom(polygon: Polygon): this {
    this.points = polygon.points.slice()

    return this
  }

  public copyTo(polygon: Polygon): Polygon {
    polygon.copyFrom(this)

    return polygon
  }

  public applyMatrix(matrix: Matrix): this {
    const { a, b, c, d, tx, ty } = matrix;

    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      const x = a * point.x + c * point.y + tx;
      const y = b * point.x + d * point.y + ty;

      point.x = x;
      point.y = y;
    }

    return this
  }
}