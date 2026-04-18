import { Container } from "./Container"
import type { Layer } from "./Layer"
import { Point, type PointData } from "./maths"
import { type KonvaEventObject, Node } from "./Node"
import { getPointFromEvent } from "./shared/point"

export interface StageConfig {
  draggable: boolean
  height: number
  width: number
}

export type Sizes = {
  width: number
  height: number
}

type EventTargetNode = Node | Stage

type PointerState = {
  downTarget: EventTargetNode | null
  hoverTarget: EventTargetNode | null
  lastTapTarget: EventTargetNode | null
  lastTapTime: number
}

const DOUBLE_CLICK_WINDOW = 400

const MOUSE_ALIASES: Partial<Record<string, string>> = {
  pointerdown: "mousedown",
  pointermove: "mousemove",
  pointerup: "mouseup",
  pointerover: "mouseover",
  pointerout: "mouseout",
  pointerenter: "mouseenter",
  pointerleave: "mouseleave",
}

const TOUCH_ALIASES: Partial<Record<string, string>> = {
  pointerdown: "touchstart",
  pointermove: "touchmove",
  pointerup: "touchend",
  pointercancel: "touchcancel",
}

const isContainerNode = (node: Node): node is Container<Node> => node instanceof Container

export class Stage extends Container<Layer> {
  public readonly absolutePositionCursor = new Point()
  public readonly sizes: Sizes = {
    width: 0,
    height: 0,
  }

  public content: HTMLDivElement = document.createElement("div")

  protected _type = "Stage"

  private readonly _pointerStates = new Map<number, PointerState>()
  private readonly _boundHandlePointerMove = (event: PointerEvent) => {
    this.absolutePositionCursor.copyFrom(getPointFromEvent(event))
    this._dispatchPointerMove(event)
  }
  private readonly _boundHandlePointerDown = (event: PointerEvent) => {
    this.absolutePositionCursor.copyFrom(getPointFromEvent(event))
    this._dispatchPointerDown(event)
  }
  private readonly _boundHandlePointerUp = (event: PointerEvent) => {
    this.absolutePositionCursor.copyFrom(getPointFromEvent(event))
    this._dispatchPointerUp(event)
  }
  private readonly _boundHandlePointerCancel = (event: PointerEvent) => {
    this.absolutePositionCursor.copyFrom(getPointFromEvent(event))
    this._dispatchPointerCancel(event)
  }
  private readonly _boundHandlePointerLeave = (event: PointerEvent) => {
    this.absolutePositionCursor.copyFrom(getPointFromEvent(event))
    this._dispatchPointerLeave(event)
  }
  private readonly _boundHandleClick = (event: MouseEvent) => {
    this._dispatchClickLikeEvent(event, "click", "pointerclick")
  }
  private readonly _boundHandleDoubleClick = (event: MouseEvent) => {
    this._dispatchClickLikeEvent(event, "dblclick", "pointerdblclick")
  }
  private readonly _boundHandleContextMenu = (event: MouseEvent) => {
    this._dispatchFromDomEvent("contextmenu", event)
  }

  public constructor(config: StageConfig) {
    super({})

    this.sizes.width = config.width
    this.sizes.height = config.height

    this.content.style.width = `${this.sizes.width}px`
    this.content.style.height = `${this.sizes.height}px`
    this.content.style.position = "relative"

    document.body.appendChild(this.content)

    this._bindContentEvents()
    this.render()
  }

  public getPoints(): Array<PointData> {
    return []
  }

  public getType() {
    return this._type
  }

  public draw(_context: CanvasRenderingContext2D): void { }

  public render() {
    this.getChildren().forEach((layer) => layer.draw())
    requestAnimationFrame(this.render.bind(this))
  }

  public add(...layers: Array<Layer>) {
    layers.forEach((layer) => {
      this.content.appendChild(layer.getCanvas())
      this.getChildren().push(layer)
      layer.setParent(this)
      layer.setStage(this)
    })
  }

  private _bindContentEvents(): void {
    this.content.addEventListener("pointermove", this._boundHandlePointerMove)
    this.content.addEventListener("pointerdown", this._boundHandlePointerDown)
    this.content.addEventListener("pointerup", this._boundHandlePointerUp)
    this.content.addEventListener("pointercancel", this._boundHandlePointerCancel)
    this.content.addEventListener("pointerleave", this._boundHandlePointerLeave)
    this.content.addEventListener("click", this._boundHandleClick)
    this.content.addEventListener("dblclick", this._boundHandleDoubleClick)
    this.content.addEventListener("contextmenu", this._boundHandleContextMenu)
  }

  private _dispatchPointerMove(event: PointerEvent): void {
    const target = this._resolveTargetForPointerEvent(event)
    const state = this._getPointerState(event.pointerId)

    this._updateHoverTargets(state.hoverTarget, target, event)
    state.hoverTarget = target

    this._dispatchEventSequence(target, ["pointermove"], event)
  }

  private _dispatchPointerDown(event: PointerEvent): void {
    const target = this._resolveTargetForPointerEvent(event)
    const state = this._getPointerState(event.pointerId)

    state.downTarget = target
    this._dispatchEventSequence(target, ["pointerdown"], event)
  }

  private _dispatchPointerUp(event: PointerEvent): void {
    const target = this._resolveTargetForPointerEvent(event)
    const state = this._getPointerState(event.pointerId)

    this._dispatchEventSequence(target, ["pointerup"], event)

    if (event.pointerType === "touch" && state.downTarget === target) {
      const now = Date.now()
      const isDoubleTap = state.lastTapTarget === target && now - state.lastTapTime <= DOUBLE_CLICK_WINDOW

      this._dispatchEventSequence(target, ["tap"], event)
      if (isDoubleTap) {
        this._dispatchEventSequence(target, ["dbltap"], event)
      }

      state.lastTapTarget = target
      state.lastTapTime = now
    }

    state.downTarget = null
  }

  private _dispatchPointerCancel(event: PointerEvent): void {
    const state = this._getPointerState(event.pointerId)
    const target = state.downTarget ?? state.hoverTarget ?? this

    this._dispatchEventSequence(target, ["pointercancel"], event)
    state.downTarget = null
  }

  private _dispatchPointerLeave(event: PointerEvent): void {
    const state = this._getPointerState(event.pointerId)
    this._updateHoverTargets(state.hoverTarget, null, event)
    state.hoverTarget = null
  }

  private _dispatchClickLikeEvent(
    event: MouseEvent,
    mouseEventName: "click" | "dblclick",
    pointerEventName: "pointerclick" | "pointerdblclick"
  ): void {
    const pointerId = this._resolvePointerId(event)
    const state = this._getPointerState(pointerId)
    const target = this._resolveTargetForMouseEvent(event)

    if (state.downTarget !== target) {
      return
    }

    this._dispatchEventSequence(target, [mouseEventName, pointerEventName], event)

    if (state.hoverTarget === null) {
      state.downTarget = null
    }
  }

  private _dispatchFromDomEvent(eventName: string, event: MouseEvent | PointerEvent): void {
    const target = "pointerId" in event
      ? this._resolveTargetForPointerEvent(event)
      : this._resolveTargetForMouseEvent(event)

    this._dispatchEventSequence(target, [eventName], event)
  }

  private _dispatchEventSequence(
    target: EventTargetNode,
    eventNames: string[],
    domEvent: MouseEvent | PointerEvent,
    bubble = true
  ): void {
    eventNames.forEach((eventName) => {
      this._fireEvent(target, eventName, domEvent, bubble)

      if ("pointerType" in domEvent) {
        const alias = this._resolvePointerAlias(eventName, domEvent.pointerType)
        if (alias) {
          this._fireEvent(target, alias, domEvent, bubble)
        }
      }
    })
  }

  private _fireEvent(
    target: EventTargetNode,
    eventName: string,
    domEvent: MouseEvent | PointerEvent,
    bubble: boolean
  ): void {
    target.fire(
      eventName,
      {
        evt: domEvent,
        target,
        currentTarget: target,
        cancelBubble: false,
      } satisfies Partial<KonvaEventObject<MouseEvent | PointerEvent>>,
      bubble
    )
  }

  private _updateHoverTargets(
    previousTarget: EventTargetNode | null,
    nextTarget: EventTargetNode | null,
    event: PointerEvent
  ): void {
    if (previousTarget === nextTarget) return

    const previousPath = previousTarget ? this._getEventPath(previousTarget) : []
    const nextPath = nextTarget ? this._getEventPath(nextTarget) : []

    let sharedIndex = 0
    while (
      sharedIndex < previousPath.length &&
      sharedIndex < nextPath.length &&
      previousPath[previousPath.length - 1 - sharedIndex] === nextPath[nextPath.length - 1 - sharedIndex]
    ) {
      sharedIndex += 1
    }

    const previousExclusive = previousPath.slice(0, previousPath.length - sharedIndex)
    const nextExclusive = nextPath.slice(0, nextPath.length - sharedIndex)

    if (previousTarget) {
      this._dispatchEventSequence(previousTarget, ["pointerout"], event)
    }

    previousExclusive.forEach((node) => {
      this._fireEvent(node, "pointerleave", event, false)

      if (event.pointerType === "mouse") {
        this._fireEvent(node, "mouseleave", event, false)
      }
    })

    if (nextTarget) {
      this._dispatchEventSequence(nextTarget, ["pointerover"], event)
    }

    nextExclusive
      .slice()
      .reverse()
      .forEach((node) => {
        this._fireEvent(node, "pointerenter", event, false)

        if (event.pointerType === "mouse") {
          this._fireEvent(node, "mouseenter", event, false)
        }
      })
  }

  private _resolvePointerAlias(eventName: string, pointerType: string): string | null {
    if (pointerType === "mouse") {
      return MOUSE_ALIASES[eventName] ?? null
    }

    if (pointerType === "touch") {
      return TOUCH_ALIASES[eventName] ?? null
    }

    return null
  }

  private _resolveTargetForPointerEvent(event: PointerEvent): EventTargetNode {
    const point = this._toStagePoint(getPointFromEvent(event))
    return this._findTopmostTarget(point) ?? this
  }

  private _resolveTargetForMouseEvent(event: MouseEvent): EventTargetNode {
    const point = this._toStagePoint(getPointFromEvent(event))
    return this._findTopmostTarget(point) ?? this
  }

  private _toStagePoint(point: PointData): PointData {
    const rect = this.content.getBoundingClientRect()

    return {
      x: point.x - rect.left,
      y: point.y - rect.top,
    }
  }

  private _findTopmostTarget(point: PointData): Node | null {
    const layers = this.getChildren()

    for (let i = layers.length - 1; i >= 0; i -= 1) {
      const match = this._findTopmostNodeInBranch(layers[i], point)
      if (match) return match
    }

    return null
  }

  private _findTopmostNodeInBranch(node: Node, point: PointData): Node | null {
    if (isContainerNode(node)) {
      const children = node.getChildren()
      for (let i = children.length - 1; i >= 0; i -= 1) {
        const match = this._findTopmostNodeInBranch(children[i], point)
        if (match) return match
      }
    }

    return node.contains(point.x, point.y) ? node : null
  }

  private _getPointerState(pointerId: number): PointerState {
    let state = this._pointerStates.get(pointerId)

    if (!state) {
      state = {
        downTarget: null,
        hoverTarget: null,
        lastTapTarget: null,
        lastTapTime: 0,
      }

      this._pointerStates.set(pointerId, state)
    }

    return state
  }

  private _resolvePointerId(event: MouseEvent): number {
    return "pointerId" in event ? (event as PointerEvent).pointerId : 1
  }

  private _getEventPath(target: EventTargetNode): EventTargetNode[] {
    return [target, ...target.getAllParents<EventTargetNode>()]
  }
}
