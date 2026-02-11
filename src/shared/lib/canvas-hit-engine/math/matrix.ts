import { Point, type PointData } from "./point";

export interface TransformableObject {
  position: PointData
  scale: PointData
  pivot: PointData
  skew: PointData
  rotation: number
}

export class Matrix {
  public array: Float32Array | null = null

  public pivot: PointData = {
    x: 0,
    y: 0,
  }

  /**
   * 
   * @param a - x scale
   * @param b - y skew
   * @param c - x skew
   * @param d - y scale
   * @param tx - x translation
   * @param ty - y translation
   */
  constructor(
    public a: number = 1,
    public b: number = 0,
    public c: number = 0,
    public d: number = 1,
    public tx: number = 0,
    public ty: number = 0,
  ) { }

  public clear(): this {
    this.a = 1
    this.b = 0
    this.c = 0
    this.d = 1
    this.tx = 0
    this.ty = 0

    return this
  }

  public fromArray(array: number[]): void {
    this.a = array[0]
    this.b = array[1]
    this.c = array[2]
    this.d = array[3]
    this.tx = array[4]
    this.ty = array[5]
  }

  public set(a: number, b: number, c: number, d: number, tx: number, ty: number) {
    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.tx = tx
    this.ty = ty
  }

  public setPivot(x: number, y: number): this {
    this.pivot.x = x
    this.pivot.y = y

    return this
  }

  public apply<P extends PointData = Point>(position: PointData, newPosition?: P): P {
    newPosition = (newPosition || new Point()) as P

    const x = position.x
    const y = position.y

    newPosition.x = (this.a * x) + (this.c * y) + this.tx
    newPosition.y = (this.b * x) + (this.d * y) + this.ty

    return newPosition
  }

  public translate(x: number, y: number): this {
    this.tx = x
    this.ty = y

    return this
  }

  public scale(x: number, y: number): this {
    this.a *= x
    this.d *= y
    this.c *= x
    this.d *= y
    this.tx *= x
    this.ty *= y

    return this
  }

  public rotate(angle: number): this {
    const pivot = this.pivot

    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const a1 = this.a
    const b1 = this.b
    const c1 = this.c
    const d1 = this.d
    const tx = this.tx
    const ty = this.ty

    this.a = (a1 * cos) - (b1 * sin)
    this.b = (a1 * sin) + (b1 * cos)
    this.c = (c1 * cos) - (d1 * sin)
    this.d = (c1 * sin) + (d1 * cos)
    this.tx = (tx * cos) - (ty * sin)
    this.ty = (tx * sin) + (ty * cos)

    if (pivot) {
      const px = pivot.x
      const py = pivot.y
      this.tx += (1 - cos) * px + sin * py
      this.ty += (1 - cos) * py - sin * px
    }

    return this
  }

  public setTransform(
    x: number, y: number,
    pivotX: number, pivotY: number,
    scaleX: number, scaleY: number,
    rotation: number,
    skewX: number, skewY: number
  ): this {
    this.a = Math.cos(rotation + skewY) * scaleX
    this.b = Math.sin(rotation + skewY) * scaleX
    this.c = -Math.sin(rotation - skewX) * scaleY
    this.d = Math.cos(rotation - skewX) * scaleY

    this.tx = x - ((pivotX * this.a) + (pivotY * this.c))
    this.ty = y - ((pivotX * this.b) + (pivotY * this.d))

    return this
  }

  public clone(): Matrix {
    const matrix = new Matrix()

    matrix.a = this.a
    matrix.b = this.b
    matrix.c = this.c
    matrix.d = this.d
    matrix.tx = this.tx
    matrix.ty = this.ty

    return matrix
  }

  public copyTo(matrix: Matrix): Matrix {
    matrix.a = this.a
    matrix.b = this.b
    matrix.c = this.c
    matrix.d = this.d
    matrix.tx = this.tx
    matrix.ty = this.ty

    return matrix
  }

  public copyFrom(matrix: Matrix): this {
    this.a = matrix.a
    this.b = matrix.b
    this.c = matrix.c
    this.d = matrix.d
    this.tx = matrix.tx
    this.ty = matrix.ty

    return this
  }

  public equals(matrix: Matrix) {
    return (
      matrix.a === this.a &&
      matrix.b === this.b &&
      matrix.c === this.c &&
      matrix.d === this.d &&
      matrix.tx === this.tx &&
      matrix.ty === this.ty
    )
  }
}
