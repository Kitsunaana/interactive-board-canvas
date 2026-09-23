import type { Node } from "../core/Node";
import { createRoute } from "../EventBus";
import { Point } from "../maths";
import { pointFromEvent } from "../shared/point";
import type { EventObject } from "./EventBehavior_v2";

export class DragBehavior {
  public readonly routes = {
    processDrag: createRoute("processDrag"),
    finishDrag: createRoute("finishDrag"),
    startDrag: createRoute("startDrag"),
  }

  private _deltaBetweenStartAndObjectPositions: Point = Point.zero()
  private _currentPosition: Point = Point.zero()
  private _startPosition: Point = Point.zero()

  private _isDragging: boolean = false

  public get isDragging() {
    return this._isDragging
  }

  public get startPosition() {
    return this._startPosition
  }

  public get currentPosition() {
    return this._currentPosition
  }

  public get deltaBetweenStartAndObjectPositions() {
    return this._deltaBetweenStartAndObjectPositions
  }

  public get delta() {
    return this.currentPosition.sub(this.startPosition)
  }

  public get nextPosition() {
    return this.startPosition.add(this.delta)
  }

  public constructor(private readonly node: Node) {
    this.bindEvents()
  }

  public subscribe(): void {
    this.node.events.on("pointerdown", this.start)
  }

  public unsubscribe(): void {
    this.node.events.off("pointerdown", this.start)

    window.removeEventListener("pointermove", this.process)
    window.removeEventListener("pointerup", this.finish)
  }

  public bindEvents(): void {
    this.process = this.process.bind(this)
    this.finish = this.finish.bind(this)
    this.start = this.start.bind(this)
  }

  public start(event: EventObject<PointerEvent>): void {
    event.stopPropagation()
    this.reset()
    
    if (this._isDragging) return
    this._isDragging = true

    const position = this.node.layer.screenToWorld(pointFromEvent(event.evt))

    this._startPosition.copyFrom(position)
    this._currentPosition.copyFrom(position)

    this._deltaBetweenStartAndObjectPositions.copyFrom(this._startPosition.sub(this.node.position))
    this.node.emitter.emit(this.routes.startDrag())

    window.addEventListener("pointermove", this.process)
    window.addEventListener("pointerup", this.finish)
  }

  public process(event: PointerEvent): void {
    if (this._isDragging === false) return

    const position = this.node.layer.screenToWorld(pointFromEvent(event))
    const nextPosition = position.sub(this._deltaBetweenStartAndObjectPositions)

    this._currentPosition.copyFrom(nextPosition)
    this.node.emitter.emit(this.routes.processDrag())
  }

  public finish(event: PointerEvent): void {
    if (this._isDragging === false) return

    this._isDragging = false
    this.node.emitter.emit(this.routes.finishDrag())

    window.removeEventListener("pointermove", this.process)
    window.removeEventListener("pointerup", this.finish)
  }

  public reset() {
    this._deltaBetweenStartAndObjectPositions = Point.zero()
    this._currentPosition = Point.zero()
    this._startPosition = Point.zero()
  }
}