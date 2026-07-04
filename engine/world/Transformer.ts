import _, { first, isNil, times } from "lodash"
import { Group } from "../Group"
import { Matrix3x3, Point, type PointData, Polygon, Rectangle } from "../maths"
import { PolygonShape } from "../shapes/Polygon"
import { pointFromEvent } from "../shared/point"
import { drawOriginPoint, type TramsformOperation } from "../behaviors/Transformable"
import { Shape } from "../shapes/Shape"

// n - Верхняя
// e - Правая
// s - Нижняя
// w - Левая

// nw - Верхняя левая
// ne - Верхняя правая
// se - Нижняя правая
// sw - Нижняя левая
export type ResizeHandler = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

export class Tranformer extends Group {
  private readonly _initialOBB = new Rectangle()
  private readonly _obbWorldCenter = new Point()
  private readonly _handlePosition = new Point()
  private readonly _transformScale = new Point(1, 1)
  private readonly _pivotPosition = new Point()
  private readonly _worldPivot = new Point()
  private readonly _padding = 0

  public startTransform(side: ResizeHandler) {
    this._setInitialState()
    this._setPivotPosition(side)
    this._setHandlePosition(side)
    this._setWorldPivot()
  }

  public get child() {
    return first(this.children())!
  }

  constructor() {
    super()

    let canMove = false

    const side: ResizeHandler = "n"

    window.addEventListener("pointerdown", (event) => {
      this.startTransform(side)

      this.child.setOrigin("scale", this._getRelativeOriginScale(side))
      this.child.beginInteraction("scale")

      // console.log(this.child.computeMatrix(), this.child.getOriginPosition("scale"))

      canMove = true
    })

    window.addEventListener("pointermove", (event) => {
      if (canMove === false) return

      this._setTransformScale(pointFromEvent(event), side)
      this.child.updateInteraction(this._transformScale)

      console.log(this._transformScale)
    })

    window.addEventListener("pointerup", () => {
      canMove = false

      this.child.endInteraction()
      this.child.localMatrix = this.child.computeMatrix()

      this._transformScale.copyFrom(Point.one())
    })
  }

  public updateAfterTransform(): void {
  }

  public render(context: CanvasRenderingContext2D): void {
    // const cachedMatrix = this.computeMatrix()

    const invert = Matrix3x3.invert(this.child.localMatrix)
    if (isNil(invert)) return

    const cachedMatrix = Matrix3x3.compose(this.child.computeMatrix(), invert)

    // const cachedMatrix = this.child.computeMatrix()

    const originScale = this.child.getOriginPosition("scale")
    const originRotate = this.child.getOriginPosition("rotate")

    // console.log(this._getCurrentAngleToTransform())

    const originalBounds = this.child.getBounds({ skipTransform: true })

    // context.strokeRect(originalBounds.x, originalBounds.y, originalBounds.width, originalBounds.height)

    const childMatrix = this.child.computeMatrix()
    const testPoints = originalBounds.getCorners().map(childMatrix.applyToPoint.bind(childMatrix))

    // console.log(this.child._instructions[this.child._instructions.length - 1].points)

    context.beginPath()
    PolygonShape.prototype.traceLinearPath.call({ pointsToTrace: testPoints }, context)
    context.closePath()
    context.stroke()

    context.save()
    cachedMatrix.applyToContext(context)
    super.render(context)
    context.restore()

    drawOriginPoint(context, originScale, "originScale")
    // drawOriginPoint(context, originRotate, "originRotate")

    drawOriginPoint(context, this._obbWorldCenter, "_obbWorldCenter")
    drawOriginPoint(context, this._pivotPosition, "_pivotPosition")
    drawOriginPoint(context, this._worldPivot, "_worldPivot")

    const bounds = Polygon.getBounds(
      this
        .getBounds()
        .getCorners()
        .map(cachedMatrix.applyToPoint.bind(cachedMatrix))
    )

    const corners = bounds
      .padding(this._padding)
      .getCorners()

    context.beginPath()
    // PolygonShape.prototype.traceLinearPath.call({ pointsToTrace: corners }, context)
    context.closePath()
    context.stroke()

    this.children().map((child) => {
      if (Shape.isShape(child)) {
        const bounds = Polygon.getBounds(child.initialPoints)
        const matrix = Matrix3x3.compose(cachedMatrix, child.worldMatrix, child.localMatrix)

        const corners = bounds
          .getCorners()
          .map((point) => matrix.applyToPoint(point))

        context.beginPath()
        PolygonShape.prototype.traceLinearPath.call({ pointsToTrace: corners }, context)
        context.closePath()
        context.stroke()
        context.restore()
      }
    })
  }

  private _getRelativeOriginScale(side: ResizeHandler) {
    let relativeOrigin: PointData

    switch (side) {
      case "nw": relativeOrigin = { x: 1, y: 1 }; break
      case "n": relativeOrigin = { x: 0, y: 1 }; break
      case "ne": relativeOrigin = { x: 0, y: 1 }; break
      case "e": relativeOrigin = { x: 0, y: 0 }; break
      case "se": relativeOrigin = { x: 0, y: 0 }; break
      case "s": relativeOrigin = { x: 1, y: 0 }; break
      case "sw": relativeOrigin = { x: 1, y: 0 }; break
      case "w": relativeOrigin = { x: 1, y: 0 }; break
    }

    const isFlippedX = this.child.localMatrix.a < 0
    const isFlippedY = this.child.localMatrix.d < 0

    const correctedRelativeX = isFlippedX ? 1 - relativeOrigin.x : relativeOrigin.x
    const correctedRelativeY = isFlippedY ? 1 - relativeOrigin.y : relativeOrigin.y

    relativeOrigin.x = correctedRelativeX
    relativeOrigin.y = correctedRelativeY

    return relativeOrigin
  }

  private _getPaddingToLocalCursor(side: ResizeHandler) {
    const padding = this._padding

    switch (side) {
      case "nw": return new Point(padding, padding)
      case "n": return new Point(padding, padding)
      case "ne": return new Point(-padding, padding)
      case "e": return new Point(-padding, padding)
      case "se": return new Point(-padding, -padding)
      case "s": return new Point(padding, -padding)
      case "sw": return new Point(padding, -padding)
      case "w": return new Point(padding, -padding)
    }
  }

  private _computeDeadZoneAdjustedFactor(
    referenceScale: Point,
    pointerOffset: Point,
    axis: keyof PointData
  ): number {
    const deadZoneThreshold: number = this._padding * 2

    if (referenceScale[axis] !== 0) {
      const initialRatio = (pointerOffset[axis]) / referenceScale[axis]

      if (initialRatio > 0) return Math.max(0.01, initialRatio)
      else if (Math.abs(pointerOffset[axis]) <= deadZoneThreshold) return 0
      else {
        const deadZoneAdjustedValue = (pointerOffset[axis]) + Math.sign(referenceScale[axis]) * deadZoneThreshold
        const adjustedRatio = deadZoneAdjustedValue / referenceScale[axis]

        return Math.sign(adjustedRatio) * Math.max(0.01, Math.abs(adjustedRatio))
      }
    }

    return 1
  }

  private _setInitialState(): void {
    const children = this.children()

    if (children.length === 1) {
      const child = children[0]

      if (this.child instanceof PolygonShape) {
        const bounds = this.child.getUnrotateShapeBounds()
        this._initialOBB.copyFrom(bounds)
      } else {
        const bounds = this.child.getBounds({ skipTransform: false })
        this._initialOBB.copyFrom(bounds)
      }

    } else {
      const bounds = this.getBounds()
      this._initialOBB.copyFrom(bounds)
    }

    this._obbWorldCenter.copyFrom(this._initialOBB.center)
  }

  private _getCurrentAngleToTransform(): number {
    const cachedMatrix = this.child.localMatrix // this.child.computeMatrix()
    const currentAngle = Math.atan2(cachedMatrix.b, cachedMatrix.a)

    return currentAngle
  }

  private _setWorldPivot(): void {
    const pivotPosition = this._pivotPosition.clone()

    pivotPosition.x *= Math.sign(this.child.localMatrix.a)
    pivotPosition.y *= Math.sign(this.child.localMatrix.d)

    const rotated = Matrix3x3
      .rotate(this._getCurrentAngleToTransform())
      .applyToPoint(pivotPosition)

    const world = this._obbWorldCenter.add(rotated)

    this._worldPivot.copyFrom(world)
  }

  private _setTransformScale(currentPointer: Point, side: ResizeHandler): void {
    const worldMatrix = Matrix3x3.compose(
      Matrix3x3.translate(this._obbWorldCenter.x, this._obbWorldCenter.y),
      Matrix3x3.rotate(this._getCurrentAngleToTransform())
    )

    const localMatrix = Matrix3x3.invert(worldMatrix)
    if (isNil(localMatrix)) return

    const localCursor = localMatrix.applyToPoint(currentPointer).add(this._getPaddingToLocalCursor(side))

    const origVec = this._handlePosition.sub(this._pivotPosition)
    const cursorVec = localCursor.sub(this._pivotPosition)

    const scaleFactorX = this._computeDeadZoneAdjustedFactor(origVec, cursorVec, "x")
    const scaleFactorY = this._computeDeadZoneAdjustedFactor(origVec, cursorVec, "y") 

    this._transformScale.set(scaleFactorX, scaleFactorY)
  }

  private _setHandlePosition(side: ResizeHandler): void {
    const halfW = this._initialOBB.width / 2
    const halfH = this._initialOBB.height / 2

    let handleX = 0
    let handleY = 0

    switch (side) {
      case "nw":
        handleX = -halfW;
        handleY = -halfH;
        break
      case "n":
        handleX = 0;
        handleY = -halfH;
        break
      case "ne":
        handleX = halfW;
        handleY = -halfH;
        break
      case "e":
        handleX = halfW;
        handleY = 0;
        break
      case "se":
        handleX = halfW;
        handleY = halfH;
        break
      case "s":
        handleX = 0;
        handleY = halfH;
        break
      case "sw":
        handleX = -halfW;
        handleY = halfH;
        break
      case "w":
        handleX = -halfW;
        handleY = 0;
        break
    }

    handleX *= Math.sign(this.child.localMatrix.a)
    handleY *= Math.sign(this.child.localMatrix.d)

    this._handlePosition.set(handleX, handleY)
  }

  private _setPivotPosition(side: ResizeHandler): void {
    const halfW = this._initialOBB.width / 2
    const halfH = this._initialOBB.height / 2

    let pivotX = 0
    let pivotY = 0

    switch (side) {
      case "nw":
        pivotX = halfW;
        pivotY = halfH;
        break
      case "n":
        pivotX = 0;
        pivotY = halfH;
        break
      case "ne":
        pivotX = -halfW;
        pivotY = halfH;
        break
      case "e":
        pivotX = -halfW;
        pivotY = 0;
        break
      case "se":
        pivotX = -halfW;
        pivotY = -halfH;
        break
      case "s":
        pivotX = 0;
        pivotY = -halfH;
        break
      case "sw":
        pivotX = halfW;
        pivotY = -halfH;
        break
      case "w":
        pivotX = halfW;
        pivotY = 0;
        break
    }

    pivotX *= Math.sign(this.child.localMatrix.a)
    pivotY *= Math.sign(this.child.localMatrix.d)

    this._pivotPosition.set(pivotX, pivotY)
  }
}

