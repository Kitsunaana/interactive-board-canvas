import { Matrix3x3, Point, Polygon, type PointData } from "../maths"
import { Node } from "../Node"

export type TramsformOperation = "scale" | "skew" | "rotate"

export const TRANSFORM_OPERATIONS = ["rotate", "skew", "scale"] as Array<TramsformOperation>

export type TransformScaleInstruction = {
  type: "scale"
  value: PointData
  relativeOrigin: PointData
}

export type TransformSkewInstruction = {
  type: "skew"
  value: PointData
  relativeOrigin: PointData
}

export type TransformRotateInstruction = {
  type: "rotate"
  value: number
  relativeOrigin: PointData
}

export type TransformInstruction =
  | TransformScaleInstruction
  | TransformSkewInstruction
  | TransformRotateInstruction

export const buildInitialOpearationsRecord = (): Record<TramsformOperation, Point> => ({
  rotate: new Point(),
  scale: new Point(),
  skew: new Point(),
})

export class Transformable {
  private _translate: Point = new Point(0, 0)
  private _instructions: TransformInstruction[] = []

  private _cachedBaseMatrix: Matrix3x3 | null = null
  private _isInteracting: boolean = false

  public currentRelativeOrigins = buildInitialOpearationsRecord()
  public isShowOrigins: boolean = false

  public constructor(private readonly _node: Node) { }

  public initialize(): void {
    this.currentRelativeOrigins.rotate.set(0.5, 0.5)
    this.currentRelativeOrigins.scale.set(0.0, 0.0)
    this.currentRelativeOrigins.skew.set(1.0, 1.0)

    this._instructions = []
    this._translate.set(0, 0)
  }

  public setOrigin(operation: TramsformOperation, relativeOrigin: PointData): void {
    this.currentRelativeOrigins[operation].set(relativeOrigin.x, relativeOrigin.y)
  }

  public translate(delta: PointData): void {
    this._translate.copyFrom(Point.add(this._translate, delta))
  }

  public rotate(angle: number): void {
    this._pushInstruction({
      relativeOrigin: this.currentRelativeOrigins.rotate.clone(),
      type: "rotate",
      value: angle,
    })
  }

  public scale(scale: PointData): void {
    this._pushInstruction({
      relativeOrigin: this.currentRelativeOrigins.scale.clone(),
      type: "scale",
      value: scale,
    })
  }

  public skew(skew: PointData): void {
    this._pushInstruction({
      relativeOrigin: this.currentRelativeOrigins.skew.clone(),
      type: "skew",
      value: skew,
    })
  }

  private _pushInstruction(instruction: TransformInstruction): void {
    this._instructions.push(instruction)
  }

  public beginInteraction(type: TramsformOperation): void {
    const identityValue = ({
      rotate: () => 0,
      scale: () => ({ x: 1, y: 1 }),
      skew: () => ({ x: 0, y: 0 })
    })[type]()

    this._instructions.push({
      type,
      value: identityValue,
      relativeOrigin: {
        x: this.currentRelativeOrigins[type].x,
        y: this.currentRelativeOrigins[type].y
      },
    } as TransformInstruction)

    this._cachedBaseMatrix = this._computeMatrixUpTo(this._instructions.length - 1)
    this._isInteracting = true
  }

  public updateInteraction(value: number | PointData): void {
    if (!this._isInteracting || this._instructions.length === 0) return

    const last = this._instructions[this._instructions.length - 1]
    last.value = value
  }

  public endInteraction(): void {
    this._isInteracting = false
    this._cachedBaseMatrix = null
  }

  public computeMatrix(): Matrix3x3 {
    if (this._isInteracting && this._cachedBaseMatrix) {
      return this._computeLastStepFromCache()
    }

    return this._computeMatrixUpTo(this._instructions.length)
  }

  private _computeMatrixUpTo(count: number): Matrix3x3 {
    const originalPoints = this._node.getPoints().map((point) => ({ ...point }))
    let accumulated = Matrix3x3.identity()

    for (let i = 0; i < count; i++) {
      const instruction = this._instructions[i]
      const stepMatrix = this._buildStepForInstruction(instruction, originalPoints, accumulated)
      accumulated = Matrix3x3.compose(stepMatrix, accumulated)
    }

    return accumulated
  }

  private _computeLastStepFromCache(): Matrix3x3 {
    const base = this._cachedBaseMatrix!
    const lastInstruction = this._instructions[this._instructions.length - 1]
    const originalPoints = this._node.getPoints().map((point) => ({ ...point }))

    const stepMatrix = this._buildStepForInstruction(lastInstruction, originalPoints, base)
    return Matrix3x3.compose(stepMatrix, base)
  }

  private _buildStepForInstruction(
    instruction: TransformInstruction,
    originalPoints: PointData[],
    accumulated: Matrix3x3,
  ): Matrix3x3 {
    const originalBounds = Polygon.prototype.getBounds.call({ points: originalPoints })

    const originInOriginalSpace: PointData = {
      x: originalBounds.x + originalBounds.width * instruction.relativeOrigin.x,
      y: originalBounds.y + originalBounds.height * instruction.relativeOrigin.y,
    }

    const absoluteOrigin = accumulated.applyToPoint(originInOriginalSpace)
    const currentAngle = Math.atan2(accumulated.b, accumulated.a)

    return Matrix3x3.aroundOrigin(absoluteOrigin, () => {
      if (instruction.type === "rotate") return Matrix3x3.rotate(instruction.value)

      const rotation = Matrix3x3.rotate(currentAngle)
      const inverseRotation = Matrix3x3.rotate(-currentAngle)
      const operation = Matrix3x3[instruction.type](instruction.value.x, instruction.value.y)

      return Matrix3x3.compose(rotation, operation, inverseRotation)
    })
  }

  public getOriginPosition(operation: TramsformOperation): PointData {
    const matrix = this.computeMatrix()
    const originalPoints = this._node.getPoints().map((point) => ({ ...point }))
    const originalBounds = Polygon.prototype.getBounds.call({ points: originalPoints })

    const originInOriginalSpace: PointData = {
      x: originalBounds.x + originalBounds.width * this.currentRelativeOrigins[operation].x,
      y: originalBounds.y + originalBounds.height * this.currentRelativeOrigins[operation].y,
    }

    return matrix.applyToPoint(originInOriginalSpace)
  }

  public bindTransformsToContext(context: CanvasRenderingContext2D): void {
    context.translate(this._translate.x, this._translate.y)
    const matrix = this.computeMatrix()
    matrix.applyToContext(context)
  }

  public render(context: CanvasRenderingContext2D): void {
    if (this.isShowOrigins) {
      context.save()
      context.translate(this._translate.x, this._translate.y)

      const rotateOrigin = this.getOriginPosition("rotate")
      const scaleOrigin = this.getOriginPosition("scale")
      const skewOrigin = this.getOriginPosition("skew")

      drawOriginPoint(context, rotateOrigin, "rotate")
      drawOriginPoint(context, scaleOrigin, "scale")
      drawOriginPoint(context, skewOrigin, "skew")

      context.restore()
    }
  }
}

export function drawOriginPoint(context: CanvasRenderingContext2D, point: PointData, caption: string) {
  context.beginPath()
  context.font = "14px Roboto"
  context.textAlign = "center"
  context.textBaseline = "bottom"
  context.fillText(caption, point.x, point.y - 5)
  context.arc(point.x, point.y, 5, 0, Math.PI * 2)
  context.stroke()
  context.beginPath()
  context.arc(point.x, point.y, 2, 0, Math.PI * 2)
  context.fill()
}