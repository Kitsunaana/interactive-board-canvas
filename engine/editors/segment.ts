import type { EventObject } from "../behaviors/EventBehavior";
import type { PointData } from "../maths";
import { type PolygonConfig, PolygonShape } from "../shapes/Polygon";
import { pointFromEvent } from "../shared/point";
import type { BaseBezierHandle } from "./cbp-manager";
import { CubicBezierPath, type HandlerType, type HandlerChild } from "./cubic-bezier-path";
import { type CubicBezierSegmentData, type Node, computeHandleOffsets, findClosestT, splitCubicBezierSegment } from "./cubic-utils";

type RestrictKey = "start" | "end"

const segmentPointsToHandles = (points: Array<PointData>) => {
  if (points.length < 6) throw new Error("Asd")

  return {
    start: {
      anchor: points[0],
      inHandle: points[1],
      outHandle: points[2],
    } satisfies Node,
    end: {
      anchor: points[3],
      inHandle: points[4],
      outHandle: points[5],
    } satisfies Node
  } as const
}

export class CubicBezierSegment extends PolygonShape {
  public dragSegmentT: number = 0

  public get parentPath() {
    return this._getFirstParentByType<CubicBezierPath>({ type: "CubicBezierPath" })
  }

  public get startAnchorIndex() {
    return this.parentPath.childrenRecord.segments.indexOf(this)
  }

  public get endAnchorIndex() {
    return this.parentPath.childrenRecord.segments.indexOf(this) + 1
  }

  public constructor(params: PolygonConfig) {
    super(params)

    this.dragBehavior.subscribe()

    this.on("pointerover", this.setActiveAppearance.bind(this))
    this.on("pointerleave", this.setIdleAppearance.bind(this))
    this.on("dblclick", this.splitSegment.bind(this))

    this.emitter.on(this.routes.processDrag, this.processDragCallback.bind(this))
    this.emitter.on(this.routes.startDrag, this.startDragCallback.bind(this))
  }

  public startDragCallback(): void {
    const startAnchorIndex = this.startAnchorIndex
    const endAnchorIndex = this.endAnchorIndex

    this.parentPath.captureInitialHandlePositions(startAnchorIndex) 
    this.parentPath.captureInitialHandlePositions(endAnchorIndex)

    const points = this.parentPath.adapterSegmentToHandles(startAnchorIndex)
    this.dragSegmentT = findClosestT(...points, this.dragBehavior.startPosition)
  }

  public processDragCallback(): void {
    const startAnchorIndex = this.startAnchorIndex
    const endAnchorIndex = this.endAnchorIndex

    const start = this.parentPath.getAnchorHandles(startAnchorIndex)
    const end = this.parentPath.getAnchorHandles(endAnchorIndex)

    const between = this.dragBehavior.deltaBetweenStartAndObjectPositions
    const delta = this.dragBehavior.delta.add(between)

    const [dLeft, dRight] = computeHandleOffsets(delta, this.dragSegmentT)

    const first = this.parentPath.dragStartPositionsByIndex[startAnchorIndex]
    const second = this.parentPath.dragStartPositionsByIndex[endAnchorIndex]

    start.outHandle.position = first.outHandle.add(dLeft)
    start.inHandle.position = first.inHandle.sub(dLeft)

    end.inHandle.position = second.inHandle.add(dRight)
    end.outHandle.position = second.outHandle.sub(dRight)

    this.parentPath.recalculateSegmentsAfterMoving()
    this.setActiveAppearance()
  }

  public splitSegment(event: EventObject<MouseEvent>) {
    const startAnchorIndex = this.startAnchorIndex

    const handles = this.parentPath.adapterSegmentToHandles(startAnchorIndex)
    const t = findClosestT(...handles, pointFromEvent(event.evt))
    if (t <= 0 || t >= 1) return

    const [left, right] = splitCubicBezierSegment(segmentPointsToHandles(this.pointsToTrace), t)

    const leftSegmentPoints = Object.values(left.start).concat(Object.values(left.end))
    const rightSegmentPoints = Object.values(right.start).concat(Object.values(right.end))

    const leftSegment = this.parentPath.createSegment(leftSegmentPoints)
    const rightSegment = this.parentPath.createSegment(rightSegmentPoints)

    this.parentPath.childrenRecord.segments.splice(startAnchorIndex, 1, leftSegment, rightSegment)
    leftSegment.parent = this.parentPath
    rightSegment.parent = this.parentPath

    const allHandlers = this
      ._createHandleSets(["start", "end"], left)
      .concat(this._createHandleSets(["end"], right))

    allHandlers.forEach((handler) => Object.values(handler).forEach((handle) => {
      handle.parent = this.parentPath
      handle.isListening = true
    }))

    this.parentPath.childrenRecord.handlers.splice(startAnchorIndex, 2, ...allHandlers)
  }

  public setIdleAppearance(): void {
    this.strokeColor = "transparent"
    this.lineWidth = 2.5
  }

  public setActiveAppearance(): void {
    this.strokeColor = "#3b6ae830"
    this.lineWidth = 14
  }

  private _createHandleSets(endpoints: Array<RestrictKey>, segmentData: CubicBezierSegmentData) {
    const HANDLES_TYPES = ["anchor", "inHandle", "outHandle"] as Array<HandlerType>

    return endpoints.map((restrict_key) => {
      return HANDLES_TYPES.reduce((acc, key) => ({
        ...acc,
        [key]: this.parentPath.createControl(segmentData[restrict_key][key], key)
      }), {} as Record<keyof HandlerChild, BaseBezierHandle>)
    })
  }
}