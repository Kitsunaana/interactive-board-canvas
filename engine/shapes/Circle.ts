import {isNull} from "lodash";
import {Bounds, Circle, Matrix3x3, Point, type PointData, Rectangle} from "../maths";
import {Shape, type ShapeConfig} from "../core/Shape";
import {type GetBoundsParams} from "../core/Node";
import {NodeTransformer} from "../behaviors/NodeTransformer";

export type CircleShapeConfig = {
  x: number
  y: number
  radius: number
}

function getCircleBoundingBox(circle: Circle, worldMatrix: Matrix3x3): Rectangle {
  const matrix = worldMatrix.toArray()

  const a = matrix[0]
  const b = matrix[1]
  const c = matrix[2]
  const d = matrix[3]
  const e = matrix[4]
  const f = matrix[5]

  const cx = a * circle.x + c * circle.y + e
  const cy = b * circle.x + d * circle.y + f

  const ux = a * circle.radius
  const uy = b * circle.radius

  const vx = c * circle.radius
  const vy = d * circle.radius

  const extentX = Math.hypot(ux, vx)
  const extentY = Math.hypot(uy, vy)

  const bounds = new Bounds(
    cx - extentX,
    cy - extentY,
    cx + extentX,
    cy + extentY
  )

  return bounds.rectangle
}

export type CircleConfig = ShapeConfig & {
  x: number
  y: number
  radius: number
}

export class CircleShape extends Shape {
  public static isCircle(candidate: unknown): candidate is CircleShape {
    return candidate instanceof CircleShape
  }

  public type = "Cirle" as const

  private readonly _initRadius: number

  public isListening: boolean = true

  public get radius() {
    return this.bounds.width / 2
  }

  public get position(): Point {
    return this.bounds.center
  }

  public set position(nextPos: PointData) {
    super.position = nextPos
  }

  public getPoints(): Array<PointData> {
    return this.initialBounds.getCorners()
  }

  public constructor({x, y, radius, ...other}: CircleConfig) {
    super(other)

    this._initRadius = radius

    this.updateBoundsUp()
    this.position = {
      x,
      y
    }
  }

  public clone() {
    return new CircleShape({
      ...this.position,
      radius: this.radius,
    })
  }

  public scale(value: PointData) {
    const uniform = value.x === 1 ? value.y : value.x
    NodeTransformer.prototype.scale.call(this, {
      x: uniform,
      y: uniform,
    })
  }

  public render(context: CanvasRenderingContext2D): void {
    if (!this.isVisible) return

    context.betweenSaveAndRestore(() => {
      this.tryApplyPreviewMatrixToContext(context)
      this.tracePath(context)
      this.fillStrokeShape(context)
    })
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    if (!this.isListening) return

    context.betweenSaveAndRestore(() => {
      this.tryApplyPreviewMatrixToContext(context)
      this.tracePath(context)
      this.fillStrokeHitShape(context)
    })
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    if (params.skipTransform) return new Circle(0, 0, this._initRadius).getBounds()

    const matrix = this.worldMatrix
    return getCircleBoundingBox(new Circle(0, 0, this._initRadius), matrix)
  }

  public getUnrotateBounds(): Rectangle {
    return this.getBounds()
  }

  public tracePath(context: CanvasRenderingContext2D): void {
    const position = this.position
    const radius = this.radius

    context.beginPath()
    context.arc(position.x, position.y, radius, 0, Math.PI * 2, false)
    context.closePath()
  }
}
