import { distance, getAngleBetweenPoints, getPointFromEvent } from "../../../point"
import type { Rectangle } from "../../math"
import * as Maths from "../../math"
import { Polygon } from "../../shapes"
import type { Transformer } from "../transformer"
import { type RotaterRect } from "./rotate-shape"
import type { RotateTransformerContext } from "./rotate.interface"
import { createDragEventsFlow } from "./shared"

class RotateGroupModel {
  public rotaterRect!: RotaterRect
  public nodes: Array<Polygon>
  public area!: Rectangle

  public isRotating = false
  public startAngle = 0
  public tempAngle = 0

  public shapesBounds: Record<string, Array<Maths.PointData>> = {}

  public constructor(private readonly transformer: Transformer) {
    this.nodes = this.transformer.nodes()
  }

  public initialize(): void {
    this.setShapesBoundsRecord()
    this.setSelectionArea()
    this.setRotaterRect()
  }

  public getInitialSelectionAreaCenter(): Maths.PointData {
    return {
      x: this.area.centerX,
      y: this.area.centerY,
    }
  }

  private setSelectionArea(): void {
    const nodesBounds = this.nodes.flatMap((node) => node.getBounds().getCorner())
    this.area = new Maths.Polygon(nodesBounds).getBounds()
  }

  public setRotaterRect(): void {
    this.rotaterRect = {
      x: this.area.centerX,
      y: this.area.y - this.transformer.rotateAnchorOffset(),
      radius: 5,
    }
  }

  public setShapesBoundsRecord(): void {
    this.nodes.forEach((shape, index) => {
      const bounds = shape.boundsSkippedRotate.clone().padding(7)
      const corners = new Maths.Polygon(bounds.getCorner())
        .applyMatrix(new Maths.Matrix()
          .setPivot(bounds.centerX, bounds.centerY)
          .rotate(shape.angle)
        )

      this.shapesBounds[index] = corners.points
    })
  }

  public canStartRotate(event: PointerEvent): boolean {
    const rotaterRect = this.rotaterRect

    const startCursor = getPointFromEvent(event)
    const canStart = distance(rotaterRect, startCursor) <= rotaterRect.radius + 4

    return canStart
  }

  public startRotate(event: PointerEvent): void {
    const initialCenter = this.getInitialSelectionAreaCenter()

    const startCursor = getPointFromEvent(event)
    const startAngle = getAngleBetweenPoints(initialCenter, startCursor)

    this.startAngle = startAngle
    this.isRotating = true
  }

  public processRotate(event: PointerEvent): void {
    const initialCenter = this.getInitialSelectionAreaCenter()
    const currentCursor = getPointFromEvent(event)

    const currentAngle = getAngleBetweenPoints(initialCenter, currentCursor)
    const deltaAngle = currentAngle - this.startAngle

    this.tempAngle = deltaAngle
  }

  public finishRotate(_event: PointerEvent): void {
    this.applyRotateShapesAroundCenterSelectionArea()
    
    this.setShapesBoundsRecord()
    this.setSelectionArea()
    this.setRotaterRect()

    this.isRotating = false
    this.tempAngle = 0
  }

  public applyRotateShapesAroundCenterSelectionArea(): void {
    const initialCenter = this.getInitialSelectionAreaCenter()

    const matrix = new Maths.Matrix()
      .setPivot(initialCenter.x, initialCenter.y)
      .rotate(this.tempAngle)

    this.nodes.forEach((node) => {
      const nextAngle = node.angle + this.tempAngle

      const cos = Math.cos(this.tempAngle)
      const sin = Math.sin(this.tempAngle)

      const bounds = node.boundsSkippedRotate

      const offsetX = bounds.centerX - initialCenter.x
      const offsetY = bounds.centerY - initialCenter.y

      const rotatedOffsetX = offsetX * cos - offsetY * sin
      const rotatedOffsetY = offsetX * sin + offsetY * cos

      const nextCenterX = initialCenter.x + rotatedOffsetX
      const nextCenterY = initialCenter.y + rotatedOffsetY

      const nextX = nextCenterX - bounds.width / 2
      const nextY = nextCenterY - bounds.height / 2

      node.angle = nextAngle

      bounds.x = nextX
      bounds.y = nextY

      node.applyMatrix(matrix)
    })
  }
}

class RotateGroupDrawer {
  public constructor(private readonly model: RotateGroupModel) { }

  public drawCommitRotater(context: CanvasRenderingContext2D): void {
    const rotater = this.model.rotaterRect

    context.beginPath()
    context.arc(rotater.x, rotater.y, rotater.radius, 0, Math.PI * 2)
    context.closePath()
    context.stroke()
  }

  public drawPreviewRotater(context: CanvasRenderingContext2D): void {
    const rotater = this.model.rotaterRect
    const area = this.model.area

    const x = rotater.x - area.centerX
    const y = rotater.y - area.centerY

    context.beginPath()
    context.arc(x, y, rotater.radius, 0, Math.PI * 2)
    context.closePath()
    context.stroke()
  }

  public drawCommit(context: CanvasRenderingContext2D): void {
    const area = this.model.area

    context.save()

    context.strokeStyle = "red"
    context.strokeRect(area.x, area.y, area.width, area.height)

    this.drawCommitRotater(context)

    this.model.nodes.forEach((shape, index) => {
      const corners = this.model.shapesBounds[index]

      context.save()
      context.strokeStyle = "black"
      context.beginPath()
      context.moveTo(corners[0].x, corners[0].y)
      corners.forEach((point) => context.lineTo(point.x, point.y))
      context.closePath()
      context.stroke()
      context.restore()

      context.strokeStyle = "blue"
      context.beginPath()
      shape.points.forEach((point) => context.lineTo(point.x, point.y))
      context.closePath()
      context.stroke()
      context.restore()
    })

    context.restore()
  }

  public drawPreview(context: CanvasRenderingContext2D): void {
    const area = this.model.area

    context.save()
    context.translate(area.centerX, area.centerY)
    context.rotate(this.model.tempAngle)

    context.strokeStyle = "red"
    context.strokeRect(-area.width / 2, -area.height / 2, area.width, area.height)

    this.drawPreviewRotater(context)

    this.model.nodes.forEach((shape) => {
      const bounds = shape.boundsSkippedRotate.clone().padding(7)

      context.save()
      context.translate(shape.bounds.centerX - area.centerX, shape.bounds.centerY - area.centerY)

      context.save()
      context.rotate(shape.angle)
      context.strokeStyle = "black"
      context.strokeRect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height)
      context.restore()

      context.strokeStyle = "blue"
      context.beginPath()
      shape.points.forEach((point) => {
        context.lineTo(point.x - bounds.centerX, point.y - bounds.centerY)
      })
      context.closePath()
      context.stroke()
      context.restore()
    })
    context.restore()
  }

  public draw(context: CanvasRenderingContext2D): void {
    if (this.model.isRotating) this.drawPreview(context)
    else this.drawCommit(context)
  }
}

export class RotateGroupTransformer implements RotateTransformerContext {
  private _drawer: RotateGroupDrawer
  private _model: RotateGroupModel

  public constructor(private readonly transformer: Transformer) {
    this._model = new RotateGroupModel(this.transformer)
    this._drawer = new RotateGroupDrawer(this._model)
  }

  public start(): void {
    this._model.initialize()

    createDragEventsFlow({
      start: this._model.startRotate.bind(this._model),
      finish: this._model.finishRotate.bind(this._model),
      process: this._model.processRotate.bind(this._model),

      guard: this._model.canStartRotate.bind(this._model),
    })
  }

  public draw(context: CanvasRenderingContext2D): void {
    this._drawer.draw(context)
  }
}