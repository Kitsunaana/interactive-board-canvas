import { Rectangle } from "./Rectangle"

export class RoundedRectangle {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public width: number = 0,
    public height: number = 0,
    public radius: number = 20,
  ) {}

  public getBounds(out?: Rectangle): Rectangle {
    out ||= new Rectangle()

    out.x = this.x
    out.y = this.x
    out.width = this.width
    out.height = this.height

    return out
  }

  public clone(): RoundedRectangle {
    return new RoundedRectangle(this.x, this.y, this.width, this.height, this.radius)
  }

  public copyFrom(rectangle: RoundedRectangle): this {
    this.x = rectangle.x
    this.y = rectangle.y
    this.width = rectangle.width
    this.height = rectangle.height

    return this
  }

  public copyTo(rectangle: RoundedRectangle): RoundedRectangle {
    rectangle.copyFrom(this)

    return rectangle
  }
}