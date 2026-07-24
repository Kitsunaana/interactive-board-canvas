import { Bounds } from "./Bounds"
import { Matrix3x3 } from "./Matrix"
import { Point } from "./Point"

export class Ellipse {
  public static getBounds(cx: number, cy: number, rx: number, ry: number, matrix: Matrix3x3 = Matrix3x3.identity()) {
    return Ellipse.prototype.getBounds.call({ cx, cy, rx, ry }, matrix)
  }

  public constructor(public cx: number, public cy: number, public rx: number, public ry: number) { }

  public getBounds(matrix: Matrix3x3 = Matrix3x3.identity()) {
    const center = matrix.applyToPoint(new Point(this.cx, this.cy))

    const halfSize = new Point(
      Math.sqrt(Math.pow(matrix.a * this.rx, 2) + Math.pow(matrix.c * this.ry, 2)),
      Math.sqrt(Math.pow(matrix.b * this.rx, 2) + Math.pow(matrix.d * this.ry, 2))
    )

    const min = center.sub(halfSize)
    const max = center.add(halfSize)

    const bounds = new Bounds(...min.array(), ...max.array())

    return bounds.rectangle
  }
}