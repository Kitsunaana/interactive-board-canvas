import { type PointData } from "./Point";

export class Matrix3x3 {
  private constructor(
    public a: number = 1,
    public b: number = 0,
    public c: number = 0,
    public d: number = 1,
    public e: number = 0,
    public f: number = 0,
  ) { }

  public static identity(): Matrix3x3 {
    return new Matrix3x3(1, 0, 0, 1, 0, 0)
  }

  public static translate(tx: number, ty: number): Matrix3x3 {
    return new Matrix3x3(1, 0, 0, 1, tx, ty)
  }

  public static scale(sx: number, sy: number): Matrix3x3 {
    return new Matrix3x3(sx, 0, 0, sy, 0, 0)
  }

  public static rotate(angle: number): Matrix3x3 {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    return new Matrix3x3(cos, sin, -sin, cos, 0, 0)
  }

  public static skew(kx: number, ky: number): Matrix3x3 {
    return new Matrix3x3(1, Math.tan(ky), Math.tan(kx), 1, 0, 0)
  }

  public static multiply(m1: Matrix3x3, m2: Matrix3x3): Matrix3x3 {
    const a = m1.a * m2.a + m1.c * m2.b
    const b = m1.b * m2.a + m1.d * m2.b
    const c = m1.a * m2.c + m1.c * m2.d
    const d = m1.b * m2.c + m1.d * m2.d
    const e = m1.a * m2.e + m1.c * m2.f + m1.e
    const f = m1.b * m2.e + m1.d * m2.f + m1.f

    return new Matrix3x3(a, b, c, d, e, f)
  }

  public static aroundOrigin(origin: PointData, operation: (m: Matrix3x3) => Matrix3x3) {
    const prev = Matrix3x3.translate(origin.x, origin.y)
    const result = operation(Matrix3x3.identity())
    const next = Matrix3x3.translate(-origin.x, -origin.y)

    return Matrix3x3.compose(prev, result, next)
  }

  public static compose(...matrices: Array<Matrix3x3>): Matrix3x3 {
    if (matrices.length === 0) return Matrix3x3.identity()

    return matrices
      .slice(1)
      .reduce(Matrix3x3.multiply, matrices[0])
  }

  public static fromArray(array: [number, number, number, number, number, number]): Matrix3x3 {
    return new Matrix3x3(...array)
  }

  public static fromContext(context: CanvasRenderingContext2D): Matrix3x3 {
    const matrix = context.getTransform()
    return new Matrix3x3(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)
  }

  public clone(): Matrix3x3 {
    return new Matrix3x3(this.a, this.b, this.c, this.d, this.e, this.f)
  }

  public applyToPoint(point: PointData): PointData {
    return {
      x: this.a * point.x + this.c * point.y + this.e,
      y: this.b * point.x + this.d * point.y + this.f,
    }
  }

  public applyToContext(context: CanvasRenderingContext2D): void {
    context.transform(this.a, this.b, this.c, this.d, this.e, this.f)
  }

  public toArray(): [number, number, number, number, number, number] {
    return [this.a, this.b, this.c, this.d, this.e, this.f]
  }
}
