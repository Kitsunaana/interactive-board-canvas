import { distance, getAngleBetweenPoints, getPointFromEvent } from "../../../point"
import * as Maths from "../../math"
import * as Shapes from "../../shapes"
import type { Transformer } from "../transformer"
import type { RotaterRect, RotateTransformerController, RotateTransformerModel } from "./rotate.interface"
import { createDragEventsFlow } from "./shared"

class RotateShapeModel implements RotateTransformerModel {
  public tempAngle = 0
  public startAngle = 0

  public isRotating = false

  public rotaterRect!: RotaterRect
  public corners!: Array<Maths.PointData>
  public bounds!: Maths.Rectangle
  public shape!: Shapes.Polygon

  public constructor(private readonly transformer: Transformer) { }

  public initialize(): void {
    this.setShape()
    this.setBounds()
    this.setCorners()
    this.setRotaterRect()
  }

  public setShape(): void {
    this.shape = this.transformer.nodes()[0]
  }

  public setCorners(): void {
    const bounds = this.bounds
    const corners = new Maths.Polygon(bounds.getCorner())
      .applyMatrix(new Maths.Matrix()
        .setPivot(bounds.centerX, bounds.centerY)
        .rotate(this.shape.angle)
      )

    this.corners = corners.points
  }

  public setBounds(): void {
    this.bounds = this.shape.boundsSkippedRotate
      .clone()
      .padding(7)
  }

  public setRotaterRect(): void {
    const initial = this.getInitialRotaterRect()
    const bounds = this.shape.boundsSkippedRotate

    const dx = initial.x - bounds.centerX
    const dy = initial.y - bounds.centerY

    const cos = Math.cos(this.shape.angle)
    const sin = Math.sin(this.shape.angle)

    const rotatedX = bounds.centerX + dx * cos - dy * sin
    const rotatedY = bounds.centerY + dx * sin + dy * cos

    this.rotaterRect = {
      radius: initial.radius,
      x: rotatedX,
      y: rotatedY,
    }
  }

  public getBoundsCenter(): Maths.PointData {
    return {
      x: this.bounds.centerX,
      y: this.bounds.centerY,
    }
  }

  public getInitialRotaterRect(): RotaterRect {
    const bounds = this.shape.boundsSkippedRotate

    return {
      y: bounds.y - this.transformer.rotateAnchorOffset(),
      x: bounds.x + bounds.width / 2,
      radius: 5,
    }
  }

  public startRotate(event: PointerEvent): void {
    const cursor = getPointFromEvent(event)

    this.startAngle = getAngleBetweenPoints(this.getBoundsCenter(), cursor)
    this.isRotating = true
  }

  public processRotate(event: PointerEvent): void {
    const cursor = getPointFromEvent(event)
    const currentCursorAngle = getAngleBetweenPoints(this.getBoundsCenter(), cursor)

    this.tempAngle = currentCursorAngle - this.startAngle
  }

  public finishRotate(_event: PointerEvent): void {
    const bounds = this.shape.boundsSkippedRotate
    const matrix = new Maths.Matrix()
      .setPivot(bounds.centerX, bounds.centerY)
      .rotate(this.tempAngle)

    this.shape.applyMatrix(matrix)

    this.shape.angle += this.tempAngle
    this.isRotating = false
    this.tempAngle = 0

    this.initialize()
  }

  public canStartRotate(event: PointerEvent): boolean {
    const cursor = getPointFromEvent(event)
    const rotater = this.rotaterRect

    return distance(cursor, rotater) <= rotater.radius + 4
  }
}

class RotateShapeDrawer {
  constructor(private readonly model: RotateShapeModel) { }

  public drawBounds(context: CanvasRenderingContext2D) {
    const bounds = this.model.bounds
    const node = this.model.shape

    context.save()
    context.strokeStyle = "red"

    if (this.model.isRotating) {
      context.translate(node.bounds.centerX, node.bounds.centerY)
      context.rotate(node.angle + this.model.tempAngle)
      context.beginPath()
      context.rect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height)
    } else {
      const corners = this.model.corners

      context.beginPath()
      context.moveTo(corners[0].x, corners[0].y)
      corners.forEach((point) => context.lineTo(point.x, point.y))
      context.closePath()
      context.stroke()
    }

    context.stroke()
    context.restore()
  }

  public drawRotater(context: CanvasRenderingContext2D) {
    const shape = this.model.shape

    context.save()
    context.beginPath()

    if (this.model.isRotating) {
      const rotater = this.model.getInitialRotaterRect()

      const x = rotater.x - shape.bounds.centerX
      const y = rotater.y - shape.bounds.centerY

      context.translate(shape.bounds.centerX, shape.bounds.centerY)
      context.rotate(shape.angle + this.model.tempAngle)
      context.arc(x, y, rotater.radius, 0, Math.PI * 2)
    } else {
      const rotater = this.model.rotaterRect

      context.arc(rotater.x, rotater.y, rotater.radius, 0, Math.PI * 2)
    }

    context.closePath()
    context.stroke()
    context.restore()
  }
}

export class RotateShapeTransform implements RotateTransformerController {
  private _drawer: RotateShapeDrawer
  private _model: RotateShapeModel

  public constructor(private readonly transformer: Transformer) {
    this._model = new RotateShapeModel(this.transformer)
    this._drawer = new RotateShapeDrawer(this._model)
  }

  public start() {
    const that = this._model

    that.initialize()

    createDragEventsFlow({
      start: that.startRotate.bind(that),
      finish: that.finishRotate.bind(that),
      process: that.processRotate.bind(that),

      guard: that.canStartRotate.bind(that),
    })
  }

  public draw(context: CanvasRenderingContext2D) {
    this._model.shape.draw(context, {
      angle: this._model.tempAngle
    })

    this._drawer.drawBounds(context)
    this._drawer.drawRotater(context)
  }
}