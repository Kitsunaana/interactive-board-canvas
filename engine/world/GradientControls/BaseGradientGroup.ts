import { isUndefined } from "lodash";
import { Group } from "../../Group";
import { Matrix3x3, Point, type PointData } from "../../maths";
import { type CircleConfig, CircleShape } from "../../shapes/Circle";
import { angleBetweenPoints, pointFromEvent } from "../../shared/point";
import type { EventObject } from "../../behaviors/EventBehavior_v2";
import { Shape } from "../reqt";
import { PolygonShape } from "../../shapes/Polygon";

export const SYSTEM_UI = "@@_SYSTEM_UI"
export const RADIUS = 6

export const findNearstT = (a: Point, b: Point, p: Point): number => {
  const ab = b.sub(a)
  const ap = p.sub(a)

  const abSquared = ab.lengthSquared()
  if (abSquared === 0) return 0
  const apDotAb = ap.lengthSquared(ab)

  const t = apDotAb / abSquared
  return Math.max(0, Math.min(1, t))
}

export const getRandomColor = () => {
  const red = Math.floor(Math.random() * 256)
  const green = Math.floor(Math.random() * 256)
  const blue = Math.floor(Math.random() * 256)

  return `rgba(${red}, ${green}, ${blue}, 1)`
}

export abstract class BaseGradientGroup extends Group {
  public readonly startHandle = this.createHandle({ names: ["startControl"] })
  public readonly endHandle = this.createHandle({ names: ["endControl"] })

  connectionLine = new PolygonShape({
    strokeStyle: "#d9d9d9",
    fillStyle: "white",
    names: [SYSTEM_UI],
    initialPoints: [],
    cubic: false,
    tension: 0,
  })

  public get targetShape() {
    const currentChild = this.children.find((child) => !child.hasName(SYSTEM_UI))
    if (isUndefined(currentChild)) throw new Error("Target shape not found")
    return currentChild as Shape
  }

  public syncTargetGradientStops() {
    this.targetShape.gradient!.steps = this.extractColorStops()
  }

  public handleConnectionLineDoubleClick(event: EventObject<MouseEvent>): void {
    event.stopPropagation()

    const stepControl = this.createStepHandleAtEvent(event)

    this.attachStepHandleDragEvents(stepControl)
    this.appendChild(stepControl)
    this.syncTargetGradientStops()
  }

  public createHandle({ names, ...config }: Partial<CircleConfig> = {}): CircleShape {
    const control = new CircleShape({
      names: isUndefined(names) ? [SYSTEM_UI] : [SYSTEM_UI, ...names],
      strokeStyle: "#d9d9d9",
      fillStyle: "white",
      radius: RADIUS,
      x: 0,
      y: 0,

      ...config
    })

    control.render = this.renderHandleColorIndicator.bind(control)

    return control
  }

  public renderHandleColorIndicator(context: CanvasRenderingContext2D): void {
    const handle = this as unknown as CircleShape
    CircleShape.prototype.render.call(handle, context)

    const color = handle.getDataAttr<string>("color")

    if (color) context.betweenSaveAndRestore(() => {
      context.beginPath()
      context.arc(handle.x + RADIUS, handle.y + RADIUS, RADIUS - 2, 0, Math.PI * 2, false)
      context.closePath()
      context.fillStyle = color
      context.fill()
    })
  }

  public calculateConnectionLineVertices(): Array<Point> {
    const start = this.startHandle.position
    const end = this.endHandle.position

    const endMatrix = Matrix3x3.aroundOrigin(this.endHandle.bounds.center, () => {
      return Matrix3x3.rotate(angleBetweenPoints(start, end))
    })

    const startMatrix = Matrix3x3.aroundOrigin(this.startHandle.bounds.center, () => {
      return Matrix3x3.rotate(angleBetweenPoints(end, start))
    })

    return [
      startMatrix.applyToPoint({ x: start.x + RADIUS, y: start.y + RADIUS - RADIUS / 2 }),
      startMatrix.applyToPoint({ x: start.x + RADIUS, y: start.y + RADIUS + RADIUS / 2 }),

      endMatrix.applyToPoint({ x: end.x + RADIUS, y: end.y + RADIUS - RADIUS / 2 }),
      endMatrix.applyToPoint({ x: end.x + RADIUS, y: end.y + RADIUS + RADIUS / 2 }),
    ]
  }

  public extractColorStops(): Array<[number, string]> {
    const stepHandles = this.children.filter((child) => (
      child.hasName(SYSTEM_UI) &&
      child.hasDataAttr("color") &&
      child.hasDataAttr("t")
    ))

    const intermediateStops = stepHandles.map((step) => [
      step.getDataAttr<number>("t"), step.getDataAttr<string>("color")
    ])

    const first = [0, this.startHandle.getDataAttr<string>("color")]
    const last = [1, this.endHandle.getDataAttr<string>("color")]

    return [first, ...intermediateStops, last] as Array<[number, string]>
  }

  public createStepHandleAtEvent(event: EventObject<MouseEvent>): CircleShape {
    const cursorPosition = pointFromEvent(event.evt).sub({ x: RADIUS, y: RADIUS })
    const start = this.startHandle.position
    const end = this.endHandle.position

    const t = findNearstT(start, end, cursorPosition)
    const projectedPosition = end.sub(start).scale(t).add(start)

    const stepHandle = this.createHandle(projectedPosition)
    stepHandle.setDataAttr("color", getRandomColor())
    stepHandle.setDataAttr("t", t)

    return stepHandle
  }

  public updateStepHandlesPositions(): void {
    const stepHandles = this.children.filter((child) => child.hasDataAttr("t"))
    const start = this.startHandle.position
    const end = this.endHandle.position

    stepHandles.forEach((step) => {
      const t = step.getDataAttr<number>("t")

      step.position = end
        .sub(start)
        .scale(t)
        .add(start)
    })
  }

  public attachStepHandleDragEvents(stepHandle: CircleShape): CircleShape {
    stepHandle.custom_events.on(stepHandle.draggable.routes.processDrag, () => {
      const cursorPosition = this.layer.worldPointer.sub({ x: RADIUS, y: RADIUS })
      const start = this.startHandle.position
      const end = this.endHandle.position

      const nextT = findNearstT(start, end, cursorPosition)
      stepHandle.setDataAttr("t", nextT)

      this.updateStepHandlesPositions()
      this.syncTargetGradientStops()
    })

    return stepHandle
  }
}