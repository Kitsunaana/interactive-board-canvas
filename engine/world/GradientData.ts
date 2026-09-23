import { Matrix3x3, Point, Rectangle } from "../maths"
import { angleBetweenPoints, getAbsolutePosition } from "../shared/point"
import type { Shape } from "./reqt"

export abstract class GradientData {
  public abstract steps: Array<readonly [number, string]>

  public abstract startRelativePosition: Point
  public abstract endRelativePosition: Point

  public abstract applyToContext(context: CanvasRenderingContext2D, shape: Shape): void

  public setStopsToGradient(gradient: CanvasGradient): void {
    this.steps.forEach(([offset, color]) => gradient.addColorStop(offset, color))
  }
}

export class LinearGradientData extends GradientData {
  public constructor(
    public startRelativePosition: Point,
    public endRelativePosition: Point,
    public steps: Array<readonly [number, string]>
  ) {
    super()
  }

  public applyToContext(context: CanvasRenderingContext2D, shape: Shape) {
    const bounds = shape.getBounds({})
    const start = getAbsolutePosition(this.startRelativePosition, bounds)
    const end = getAbsolutePosition(this.endRelativePosition, bounds)

    const gradient = context.createLinearGradient(...start.array(), ...end.array())
    this.setStopsToGradient(gradient)

    context.fillStyle = gradient
    context.fill()
  }
}

export class RadialGradientData extends GradientData {
  public constructor(
    public startRelativePosition: Point,
    public endRelativePosition: Point,
    public radiusRelativePosition: Point,
    public radiusLength: Point,
    public steps: Array<[number, string]>
  ) {
    super()
  }

  public applyToContext(context: CanvasRenderingContext2D, shape: Shape): void {
    const bounds = shape.getBounds({})
    const pattern = this._createEllipticalRadialPattern(bounds)

    context.fillStyle = this.steps[this.steps.length - 1][1]
    context.fill()

    context.fillStyle = pattern
    context.fill()
  }

  private _createEllipticalRadialPattern(bounds: Rectangle) {
    const startPos = getAbsolutePosition(this.startRelativePosition, bounds)
    const endPos = getAbsolutePosition(this.endRelativePosition, bounds)
    const radiusPos = getAbsolutePosition(this.radiusLength, bounds)

    const angle = angleBetweenPoints(startPos, endPos)

    const padding = Math.max(radiusPos.x, radiusPos.y) * 3
    const size = radiusPos.x * 2 + padding * 2

    const offscreen = document.createElement('canvas')
    offscreen.width = size
    offscreen.height = size
    const offContext = offscreen.getContext('2d')!

    const scale = Matrix3x3.aroundOrigin(startPos, () => Matrix3x3.scale(1, radiusPos.y / radiusPos.x))
    const rotate = Matrix3x3.aroundOrigin(startPos, () => Matrix3x3.rotate(angle))
    const matrix = Matrix3x3.compose(rotate, scale)

    matrix.applyToContext(offContext)

    const gradient = offContext.createRadialGradient(...startPos.array(), 0, ...startPos.array(), radiusPos.x)
    this.setStopsToGradient(gradient)

    offContext.fillStyle = gradient
    offContext.fillRect(
      startPos.x - radiusPos.x - padding,
      startPos.y - radiusPos.x - padding,
      radiusPos.x * 2 + padding * 2,
      radiusPos.x * 2 + padding * 2
    )

    const pattern = offContext.createPattern(offscreen, 'no-repeat')!

    return pattern
  }
}