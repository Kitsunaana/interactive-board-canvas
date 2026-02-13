import { first, isNull } from "lodash"
import { distance, getAngleBetweenPoints, getPointFromEvent } from "../../point"
import { Rectangle } from "../math"
import type { Polygon } from "../shapes"
import type { Transformer } from "./transformer"
import { isNotUndefined } from "../../utils"

type RotaterRect = {
  radius: number
  x: number
  y: number
}

class RotateShapeModel {
  private _bounds: Rectangle | null = null

  public initialAngle = 0
  public startCursorAngle = 0

  public rotaterRect!: RotaterRect
  public shape!: Polygon

  public constructor(private readonly transformer: Transformer) { }

  public getBounds() {
    if (isNull(this._bounds)) {
      this._bounds = this.shape.getBounds().padding(7)
    }

    return this._bounds
  }

  public finishRotate(_event: PointerEvent) {
    this.initialAngle = this.shape.angle
  }

  public rotateProcess(event: PointerEvent) {
    const cursor = getPointFromEvent(event)
    const bounds = this.getBounds()

    const currentCursorAngle = getAngleBetweenPoints({ x: bounds.centerX, y: bounds.centerY }, cursor)

    const delta = currentCursorAngle - this.startCursorAngle
    const nextRotation = this.initialAngle + delta

    this.shape.angle = nextRotation
  }

  public canStartRotate(event: PointerEvent) {
    const rotater = this.getRotaterRect({ applyAngle: true })
    const cursor = getPointFromEvent(event)
    const bounds = this.getBounds()

    this.startCursorAngle = getAngleBetweenPoints({ x: bounds.centerX, y: bounds.centerY }, cursor)

    if (distance(cursor, rotater) <= rotater.radius + 4) {
      return true
    }
  }

  public getRotaterRect({ applyAngle }: { applyAngle: boolean }) {
    const bounds = this.getBounds()

    const initial = {
      y: bounds.y - this.transformer.rotateAnchorOffset(),
      x: bounds.x + bounds.width / 2,
      radius: 5,
    }

    if (applyAngle) {
      const dx = initial.x - bounds.centerX;
      const dy = initial.y - bounds.centerY;

      const cos = Math.cos(this.shape.angle);
      const sin = Math.sin(this.shape.angle);

      const rotatedX = bounds.centerX + dx * cos - dy * sin;
      const rotatedY = bounds.centerY + dx * sin + dy * cos;

      return {
        radius: initial.radius,
        x: rotatedX,
        y: rotatedY,
      }
    }

    return initial
  }
}

class RotateShapeDrawer {
  constructor(private readonly model: RotateShapeModel) { }

  public rotateEventsFlow() {
    const move = this.model.rotateProcess.bind(this.model)

    const up = (event: PointerEvent) => {
      this.model.finishRotate(event)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }

    const down = (event: PointerEvent) => {
      if (this.model.canStartRotate(event)) {
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
      }
    }

    window.addEventListener("pointerdown", down)
  }

  public drawBounds(context: CanvasRenderingContext2D) {
    const bounds = this.model.getBounds()
    const node = this.model.shape

    context.save()
    context.strokeStyle = "red"
    context.translate(node.bounds.centerX, node.bounds.centerY)
    context.rotate(this.model.shape.angle)
    context.beginPath()
    context.rect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height)
    context.stroke()
    context.restore()
  }

  public drawRotater(context: CanvasRenderingContext2D) {
    const rotater = this.model.rotaterRect
    const node = this.model.shape

    context.save()
    context.beginPath()

    const x = rotater.x - node.bounds.centerX
    const y = rotater.y - node.bounds.centerY

    context.translate(node.bounds.centerX, node.bounds.centerY)
    context.rotate(this.model.shape.angle)
    context.arc(x, y, rotater.radius, 0, Math.PI * 2)

    context.closePath()
    context.stroke()
    context.restore()
  }
}

export class RotateShapeTransform {
  private _drawer: RotateShapeDrawer
  private _model: RotateShapeModel

  public constructor(private readonly transformer: Transformer) {
    this._model = new RotateShapeModel(this.transformer)
    this._drawer = new RotateShapeDrawer(this._model)
  }

  public start() {
    const shape = first(this.transformer.nodes())

    if (isNotUndefined(shape)) {
      this._model.shape = shape
      this._model.initialAngle = shape.angle
      this._model.rotaterRect = this._model.getRotaterRect({
        applyAngle: false,
      })

      this._drawer.rotateEventsFlow()
    }
  }

  public draw(context: CanvasRenderingContext2D) {
    this._model.shape.draw(context)

    this._drawer.drawBounds(context)
    this._drawer.drawRotater(context)
  }
}