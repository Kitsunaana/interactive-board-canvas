import type { Bounds } from "./bounds"
import type { Matrix } from "./matrix"
import type { PointData } from "./point"

export class Rectangle {
  constructor(public x: number = 0, public y: number = 0, public width: number = 0, public height: number = 0) { }

  public get left(): number {
    return this.x
  }

  public get right(): number {
    return this.x + this.width
  }

  public get top(): number {
    return this.y
  }

  public get bottom(): number {
    return this.y + this.height
  }

  public get centerX(): number {
    return this.x + this.width / 2
  }

  public get centerY(): number {
    return this.y + this.height / 2
  }

  public isEmpty(): boolean {
    return this.left === this.right || this.top === this.bottom
  }

  public clone(): Rectangle {
    return new Rectangle(this.x, this.y, this.width, this.height)
  }

  public copyFromBounds(bounds: Bounds) {
    this.x = bounds.minX
    this.y = bounds.minY
    this.width = bounds.maxX - bounds.minX
    this.height = bounds.maxY - bounds.minY

    return this
  }

  public copyFrom(rectangle: Rectangle): this {
    this.x = rectangle.x
    this.y = rectangle.y
    this.width = rectangle.width
    this.height = rectangle.height

    return this
  }

  public copyTo(rectangle: Rectangle): Rectangle {
    rectangle.copyFrom(this)

    return rectangle
  }

  public contains(x: number, y: number): boolean {
    if (this.width <= 0 || this.height <= 0) return false

    if (x >= this.x && x <= this.x + this.width && y >= this.y && this.y <= this.y + this.height) {
      return true
    }

    return false
  }

  public padding(paddingX: number = 0, paddingY: number = paddingX): this {
    this.x -= paddingX
    this.y -= paddingY

    this.width += paddingX * 2
    this.height += paddingY * 2

    return this
  }

  public scale(x: number, y: number = x): this {
    this.x *= x
    this.y *= y
    this.width *= x
    this.height *= y

    return this
  }

  public getBounds(out?: Rectangle): Rectangle {
    out ||= new Rectangle()
    out.copyFrom(this)

    return out
  }

  public set(x: number, y: number, width: number, height: number): this {
    this.x = x
    this.y = y
    this.width = width
    this.height = height

    return this
  }

  public getCorner() {
    const p1 = { x: this.x, y: this.y }
    const p2 = { x: this.x + this.width, y: this.y }
    const p3 = { x: this.x + this.width, y: this.y + this.height }
    const p4 = { x: this.x, y: this.y + this.height }

    return [p1, p2, p3, p4]
  }

  public applyMatrix(matrix: Matrix): this {
    const { a, b, c, d, tx, ty } = matrix

    const [p1, p2, p3, p4] = this.getCorner()

    const transform = (point: PointData) => ({
      x: point.x * a + point.y * c + tx,
      y: point.x * b + point.y * d + ty,
    })

    const t1 = transform(p1)
    const t2 = transform(p2)
    const t3 = transform(p3)
    const t4 = transform(p4)

    const minX = Math.min(t1.x, t2.x, t3.x, t4.x)
    const maxX = Math.max(t1.x, t2.x, t3.x, t4.x)
    const minY = Math.min(t1.y, t2.y, t3.y, t4.y)
    const maxY = Math.max(t1.y, t2.y, t3.y, t4.y)

    this.x = minX
    this.y = minY
    this.width = maxX - minX
    this.height = maxY - minY

    return this
  }
}