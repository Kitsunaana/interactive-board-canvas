import type { PointData } from "./Point"
import type { ShapePrimitive } from "./ShapePrimitive"
import { Rectangle } from "./Rectangle"

export class Polygon implements ShapePrimitive {
  public static EPS: number = 1e-9

  public static getQuadraticRoots(a: number, b: number, c: number): Array<number> {
    const roots: Array<number> = []

    if (Math.abs(a) < Polygon.EPS) {

      if (Math.abs(b) > Polygon.EPS) {
        const t = -c / b

        if (t > Polygon.EPS && t < 1 - Polygon.EPS) roots.push(t)
      }

    } else {
      const delta = b * b - 4 * a * c

      if (delta >= 0) {
        const sqrtDelta = Math.sqrt(delta)
        const t1 = (-b - sqrtDelta) / (2 * a)
        const t2 = (-b + sqrtDelta) / (2 * a)

        if (t1 > Polygon.EPS && t1 < 1 - Polygon.EPS) roots.push(t1)
        if (t2 > Polygon.EPS && t2 < 1 - Polygon.EPS) roots.push(t2)
      }
    }

    return roots
  }

  public static evaluteBezier(t: number, p0: PointData, p1: PointData, p2: PointData, p3: PointData): PointData {
    const u = 1 - t
    const u2 = u * u
    const u3 = u2 * u
    const t2 = t * t
    const t3 = t2 * t

    return {
      x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
      y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
    }
  }

  public static getBezierExtremaList(p0: PointData, p1: PointData, p2: PointData, p3: PointData) {
    const ax = -p0.x + 3 * p1.x - 3 * p2.x + p3.x
    const bx = 2 * p0.x - 4 * p1.x + 2 * p2.x
    const cx = p1.x - p0.x

    const list: Array<PointData> = []

    Polygon.getQuadraticRoots(ax, bx, cx).forEach((t) => {
      list.push(Polygon.evaluteBezier(t, p0, p1, p2, p3))
    })

    const ay = -p0.y + 3 * p1.y - 3 * p2.y + p3.y
    const by = 2 * p0.y - 4 * p1.y + 2 * p2.y
    const cy = p1.y - p0.y

    Polygon.getQuadraticRoots(ay, by, cy).forEach((t) => {
      list.push(Polygon.evaluteBezier(t, p0, p1, p2, p3))
    })

    return list
  }

  public constructor(public points: PointData[]) { }

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

  public computeTensionedCurveExtrema(tension: number): Array<PointData> {
    if (tension === 0) return []

    const points = this.points
    const length = points.length

    const nest: Array<PointData> = []

    for (let i = 0; i < length; i++) {
      const p0 = points[(i - 1 + length) % length]
      const p1 = points[i]
      const p2 = points[(i + 1) % length]
      const p3 = points[(i + 2) % length]

      const cp1: PointData = {
        x: p1.x + (p2.x - p0.x) * tension,
        y: p1.y + (p2.y - p0.y) * tension
      }

      const cp2: PointData = {
        x: p2.x - (p3.x - p1.x) * tension,
        y: p2.y - (p3.y - p1.y) * tension,
      }

      const list = Polygon.getBezierExtremaList(p1, cp1, cp2, p2)
      nest.push(...list)
    }

    return nest
  }
}