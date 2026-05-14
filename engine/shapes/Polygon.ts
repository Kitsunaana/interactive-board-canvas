import { Mixin } from "ts-mixer";
import * as Primitive from "../maths";
import type { PointData } from "../maths";
import { Shape, type ShapeConfig } from "./Shape";

export interface PolygonConfig extends ShapeConfig {
  points: Primitive.PointData[],
}

export class Polygon extends Mixin(Shape, Primitive.Polygon) {
  public tension: number = 0.3

  public constructor(config: PolygonConfig) {
    super({})

    this.points = config.points
    this.bindEvents()
  }

  public getPoints(): Array<Primitive.PointData> {
    return this.points
  }

  public getBounds(): Primitive.Rectangle {
    const points = this.getPoints().map(point => ({ ...point }))

    /**  */
    const length = points.length

    for (let i = 0; i < length; i++) {
      const p0 = points[(i - 1 + length) % length]
      const p1 = points[i]
      const p2 = points[(i + 1) % length]
      const p3 = points[(i + 2) % length]

      const cp1: PointData = {
        x: p1.x + (p2.x - p0.x) * this.tension,
        y: p1.y + (p2.y - p0.y) * this.tension
      }

      const cp2: PointData = {
        x: p2.x - (p3.x - p1.x) * this.tension,
        y: p2.y - (p3.y - p1.y) * this.tension,
      }

      const list = getBezierExtremaList(p1, cp1, cp2, p2)
      points.push(...list)
    }
    /**  */

    const bounds = Primitive.Polygon.prototype.getBounds.call({ points })

    // bounds.x += this._translate.x
    // bounds.y += this._translate.y

    bounds.x -= this.lineWidth / 2
    bounds.y -= this.lineWidth / 2
    bounds.width += this.lineWidth
    bounds.height += this.lineWidth

    return bounds
  }

  public buildPath(context: CanvasRenderingContext2D): void {
    const length = this.points.length

    context.beginPath()

    if (length < 3 || this.tension === 0) {
      context.moveTo(this.points[0].x, this.points[0].y)
      this.points.forEach(point => context.lineTo(point.x, point.y))
      context.closePath()
      return
    }

    context.moveTo(this.points[0].x, this.points[0].y)

    for (let i = 0; i < length; i++) {
      const p0 = this.points[(i - 1 + length) % length]
      const p1 = this.points[i]
      const p2 = this.points[(i + 1) % length]
      const p3 = this.points[(i + 2) % length]

      const cp1x = p1.x + (p2.x - p0.x) * this.tension
      const cp1y = p1.y + (p2.y - p0.y) * this.tension
      const cp2x = p2.x - (p3.x - p1.x) * this.tension
      const cp2y = p2.y - (p3.y - p1.y) * this.tension

      context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }

    context.closePath()
  }
}

const EPS = 1e-9

const getQuadraticRoots = (a: number, b: number, c: number): Array<number> => {
  const roots: Array<number> = []

  if (Math.abs(a) < EPS) {

    if (Math.abs(b) > EPS) {
      const t = -c / b

      if (t > EPS && t < 1 - EPS) roots.push(t)
    }

  } else {
    const delta = b * b - 4 * a * c

    if (delta >= 0) {
      const sqrtDelta = Math.sqrt(delta)
      const t1 = (-b - sqrtDelta) / (2 * a)
      const t2 = (-b + sqrtDelta) / (2 * a)

      if (t1 > EPS && t1 < 1 - EPS) roots.push(t1)
      if (t2 > EPS && t2 < 1 - EPS) roots.push(t2)
    }
  }

  return roots
}

const evaluteBezier = (t: number, p0: PointData, p1: PointData, p2: PointData, p3: PointData): PointData => {
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

const getBezierExtremaList = (p0: PointData, p1: PointData, p2: PointData, p3: PointData) => {
  const ax = -p0.x + 3 * p1.x - 3 * p2.x + p3.x
  const bx = 2 * p0.x - 4 * p1.x + 2 * p2.x
  const cx = p1.x - p0.x

  const list: Array<PointData> = []

  getQuadraticRoots(ax, bx, cx).forEach((t) => {
    list.push(evaluteBezier(t, p0, p1, p2, p3))
  })

  const ay = -p0.y + 3 * p1.y - 3 * p2.y + p3.y
  const by = 2 * p0.y - 4 * p1.y + 2 * p2.y
  const cy = p1.y - p0.y

  getQuadraticRoots(ay, by, cy).forEach((t) => {
    list.push(evaluteBezier(t, p0, p1, p2, p3))
  })

  return list
}