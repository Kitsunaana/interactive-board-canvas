import { Rectangle } from './Rectangle'
import type { ShapePrimitive } from './ShapePrimitive'

export class Circle implements ShapePrimitive {
  public readonly type = 'circle'

  public constructor(public x = 0, public y = 0, public radius = 0) { }

  public clone(): Circle {
    return new Circle(this.x, this.y, this.radius)
  }

  public contains(x: number, y: number): boolean {
    if (this.radius <= 0) return false

    const r2 = this.radius * this.radius
    let dx = (this.x - x)
    let dy = (this.y - y)

    dx *= dx
    dy *= dy

    return (dx + dy <= r2)
  }

  public getBounds(out?: Rectangle): Rectangle {
    out ||= new Rectangle()

    out.x = this.x - this.radius
    out.y = this.y - this.radius
    out.width = this.radius * 2
    out.height = this.radius * 2

    return out
  }

  public copyFrom(circle: Circle): this {
    this.x = circle.x
    this.y = circle.y
    this.radius = circle.radius

    return this
  }

  public copyTo(circle: Circle): Circle {
    circle.copyFrom(this)

    return circle
  }
}