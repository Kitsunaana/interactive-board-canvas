import { Matrix3x3 } from "./Matrix"
import { Rectangle } from "./Rectangle"

export interface BoundsData {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

const defaultMatrix = Matrix3x3.identity()

export class Bounds {
  public matrix = defaultMatrix

  private _rectangle!: Rectangle

  constructor(
    public minX: number = Infinity, public minY: number = Infinity,
    public maxX: number = -Infinity, public maxY: number = -Infinity
  ) { }

  get left(): number {
    return this.minX
  }

  get right(): number {
    return this.maxX
  }

  get top(): number {
    return this.minY
  }

  get bottom(): number {
    return this.maxY
  }

  public get x(): number {
    return this.minX
  }

  public get y(): number {
    return this.minY
  }

  public get width(): number {
    return this.maxX - this.minX
  }

  public get height(): number {
    return this.maxY - this.minY
  }

  public get isPositive(): boolean {
    return (this.maxX - this.minX > 0) && (this.maxY - this.minY > 0)
  }

  public get isValid(): boolean {
    return (this.minX + this.minY !== Infinity)
  }

  public set x(value: number) {
    const width = this.maxX - this.minX

    this.minX = value
    this.maxX = value + width
  }

  public set y(value: number) {
    const height = this.maxY - this.minY

    this.minY = value
    this.maxY = value + height
  }

  public set width(value: number) {
    this.maxX = this.minX + value
  }

  public set height(value: number) {
    this.maxY = this.minY + value
  }

  public get rectangle(): Rectangle {
    if (!this._rectangle) {
      this._rectangle = new Rectangle()
    }

    const rectangle = this._rectangle

    if (this.isEmpty()) {
      rectangle.x = 0
      rectangle.y = 0
      rectangle.width = 0
      rectangle.height = 0
    } else {
      rectangle.copyFromBounds(this)
    }

    return rectangle
  }

  public isEmpty(): boolean {
    return this.minX > this.maxX || this.minY > this.maxY
  }

  public clear(): this {
    this.minX = Infinity
    this.minY = Infinity
    this.maxX = -Infinity
    this.maxY = -Infinity

    this.matrix = defaultMatrix

    return this
  }

  public set(x1: number, y1: number, x2: number, y2: number): void {
    this.minX = x1
    this.minY = y1
    this.maxX = x2
    this.maxY = y2
  }

  public padding(paddingX: number, paddingY: number = paddingX): this {
    this.minX -= paddingX
    this.maxX += paddingX

    this.minY -= paddingY
    this.maxY += paddingY

    return this
  }

  public ceil(): this {
    this.minX = Math.floor(this.minX)
    this.minY = Math.floor(this.minY)
    this.maxX = Math.ceil(this.maxX)
    this.maxY = Math.ceil(this.maxY)

    return this
  }

  public clone(): Bounds {
    return new Bounds(this.minX, this.minY, this.maxX, this.maxY)
  }

  public copyFrom(bounds: Bounds): this {
    this.minX = bounds.minX
    this.minY = bounds.minY
    this.maxX = bounds.maxX
    this.maxY = bounds.maxY

    return this
  }

  public scale(x: number, y: number): this {
    this.minX *= x
    this.minY *= y
    this.maxX *= x
    this.maxY *= y

    return this
  }

  public containsPoint(x: number, y: number): boolean {
    if (this.minX <= x && this.minY <= y && this.maxX >= x && this.maxY >= y) {
      return true
    }

    return false
  }
}