import { Matrix3x3, Point, Polygon, Rectangle, type PointData } from "../maths"

export type TramsformOperation = "scale" | "skew" | "rotate" | "translate"

export const TRANSFORM_OPERATIONS = ["rotate", "skew", "scale", "translate"] as Array<TramsformOperation>

export type TransformScaleInstruction = {
  type: "scale"
  value: Point
  points: Array<PointData>
  relativeOrigin: PointData
}

export type TransformSkewInstruction = {
  type: "skew"
  value: Point
  points: Array<PointData>
  relativeOrigin: PointData
}

export type TransformRotateInstruction = {
  type: "rotate"
  value: Point
  points: Array<PointData>
  relativeOrigin: PointData
}

export type TransformTranslateInstruction = {
  type: "translate"
  value: Point
  points: Array<PointData>
}

export type TransformInstruction =
  | TransformScaleInstruction
  | TransformSkewInstruction
  | TransformRotateInstruction
  | TransformTranslateInstruction

export const buildInitialOpearationsRecord = (): Record<TramsformOperation, Point> => ({
  translate: new Point(),
  rotate: new Point(),
  scale: new Point(),
  skew: new Point(),
})

export abstract class Transformable {
  public abstract getBounds(): Rectangle

  private _instructions: TransformInstruction[] = []

  public _cachedBaseMatrix: Matrix3x3 = Matrix3x3.identity()
  private _isInteracting: boolean = false

  public currentRelativeOrigins = buildInitialOpearationsRecord()
  public isShowOrigins: boolean = false

  public constructor() {
    this.setInitialRelativeOrigins()
  }

  public setInitialRelativeOrigins(): void {
    this.currentRelativeOrigins.rotate.set(0.5, 0.5)
    this.currentRelativeOrigins.scale.set(0.0, 0.0)
    this.currentRelativeOrigins.skew.set(1.0, 1.0)

    this._instructions = []
  }

  public setOrigin(operation: TramsformOperation, relativeOrigin: PointData): void {
    this.currentRelativeOrigins[operation].set(relativeOrigin.x, relativeOrigin.y)
  }

  public translate(delta: Point): void {
    this._pushInstruction({
      points: this.getBounds().getCorners(),
      type: "translate",
      value: delta,
    })
  }

  public rotate(angle: number): void {
    this._pushInstruction({
      relativeOrigin: this.currentRelativeOrigins.rotate.clone(),
      points: this.getBounds().getCorners(),
      type: "rotate",
      value: new Point(angle, 0),
    })
  }

  public scale(scale: Point): void {
    this._pushInstruction({
      relativeOrigin: this.currentRelativeOrigins.scale.clone(),
      points: this.getBounds().getCorners(),
      type: "scale",
      value: scale,
    })
  }

  public skew(skew: Point): void {
    this._pushInstruction({
      relativeOrigin: this.currentRelativeOrigins.skew.clone(),
      points: this.getBounds().getCorners(),
      type: "skew",
      value: skew,
    })
  }

  private _pushInstruction(instruction: TransformInstruction): void {
    this._instructions.push(instruction)
  }

  public beginInteraction(type: TramsformOperation): void {
    const identityValue = ({
      translate: () => Point.zero(),
      rotate: () => Point.zero(),
      scale: () => Point.one(),
      skew: () => Point.zero(),
    })[type]()

    this._instructions.push({
      type,
      value: identityValue,
      points: this.getBounds().getCorners(),
      relativeOrigin: {
        x: this.currentRelativeOrigins[type].x,
        y: this.currentRelativeOrigins[type].y
      },
    })

    this._cachedBaseMatrix = this._computeMatrixUpTo(this._instructions.length - 1)
    this._isInteracting = true
  }

  public updateInteraction(value: Point | PointData): void {
    if (!this._isInteracting || this._instructions.length === 0) return

    const last = this._instructions[this._instructions.length - 1]
    last.value.copyFrom(value)
  }

  public endInteraction(): void {
    this._isInteracting = false
    this._cachedBaseMatrix = Matrix3x3.identity()
  }

  public computeMatrix(): Matrix3x3 {
    if (this._isInteracting && this._cachedBaseMatrix) {
      return this._computeLastStepFromCache()
    }

    return this._computeMatrixUpTo(this._instructions.length)
  }

  private _computeMatrixUpTo(count: number): Matrix3x3 {
    let accumulated = this._cachedBaseMatrix //Matrix3x3.identity()

    for (let i = 0; i < count; i++) {
      const instruction = this._instructions[i]

      const stepMatrix = this._buildStepForInstruction(instruction, accumulated)
      accumulated = Matrix3x3.compose(stepMatrix, accumulated)
    }

    return accumulated
  }

  private _computeLastStepFromCache(): Matrix3x3 {
    const base = this._cachedBaseMatrix!
    const lastInstruction = this._instructions[this._instructions.length - 1]

    const stepMatrix = this._buildStepForInstruction(lastInstruction, base)
    return Matrix3x3.compose(stepMatrix, base)
  }

  private _getOriginInOriginalSpace(instruction: TransformInstruction) {
    const originalBounds = Polygon.prototype.getBounds.call({ points: instruction.points })

    const propertyName = "relativeOrigin" as const

    if (propertyName in instruction) {
      return {
        x: originalBounds.x + originalBounds.width * instruction[propertyName].x,
        y: originalBounds.y + originalBounds.height * instruction[propertyName].y,
      }
    }

    return Point.zero()
  }

  private _buildStepForInstruction(
    instruction: TransformInstruction,
    accumulated: Matrix3x3,
  ): Matrix3x3 {
    const originInOriginalSpace = this._getOriginInOriginalSpace(instruction)

    const absoluteOrigin = accumulated.applyToPoint(originInOriginalSpace)
    const currentAngle = Math.atan2(accumulated.b, accumulated.a)

    return Matrix3x3.aroundOrigin(absoluteOrigin, () => {
      if (instruction.type === "rotate") return Matrix3x3.rotate(instruction.value.x)

      const rotation = Matrix3x3.rotate(currentAngle)
      const inverseRotation = Matrix3x3.rotate(-currentAngle)
      const operation = Matrix3x3[instruction.type](instruction.value.x, instruction.value.y)

      return Matrix3x3.compose(rotation, operation, inverseRotation)
    })
  }

  public getOriginPosition(operation: TramsformOperation): PointData {
    const matrix = this.computeMatrix()
    const originalBounds = this.getBounds()

    const originInOriginalSpace: PointData = {
      x: originalBounds.x + originalBounds.width * this.currentRelativeOrigins[operation].x,
      y: originalBounds.y + originalBounds.height * this.currentRelativeOrigins[operation].y,
    }

    return matrix.applyToPoint(originInOriginalSpace)
  }

  public bindTransformsToContext(context: CanvasRenderingContext2D): void {
    const matrix = this.computeMatrix()
    matrix.applyToContext(context)
  }

  public drawOrigins(context: CanvasRenderingContext2D): void {
    if (this.isShowOrigins) {
      context.save()

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