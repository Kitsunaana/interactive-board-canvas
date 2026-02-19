import { isNotUndefined } from "../../utils"
import { Rectangle, type PointData } from "../math"
import { getListWithoutItem } from "../utils/list-without-item"

export interface NodeConfig {
  className?: string
}

export abstract class Node {
  abstract _type: string

  private readonly _pointerPosition: PointData = {
    x: 0,
    y: 0,
  }

  private _classNames: Array<string> = []

  private _angle: number = 0
  private _visible: boolean = true
  private _isDragging: boolean = false
  private _interactive: boolean = true
  private _scaleX: number = 1
  private _scaleY: number = 1

  private _stage: Node | null = null
  private _layer: Node | null = null
  private _parent: Node | null = null

  public x: number = 0
  public y: number = 0

  public constructor(config: NodeConfig) {
    if (config.className) this._classNames.push(config.className)
  }

  public abstract getClientRect(): Rectangle
  public abstract contains(point: PointData): boolean
  public abstract draw(context: CanvasRenderingContext2D): void

  public on() { }
  public off() { }

  public getType() {
    return this._type
  }

  public setParent(node: Node) {
    this._parent = node
  }

  public remove() {
    this._parent = null
  }

  public destroy() { }

  public getAncestors() {
    const parents: Array<Node> = []
    let candidate = this._parent

    while (candidate !== null) {
      parents.push(candidate)
      candidate = candidate._parent
    }

    return parents
  }

  public isListening() {
    return this._interactive
  }

  public isVisible() {
    return this.isVisible
  }

  public show() {
    this._visible = true
  }

  public hide() {
    this._visible = false
  }

  public getRelativePointerPosition() {
    const rect = this.getClientRect()

    return {
      x: this._pointerPosition.x - rect.x,
      y: this._pointerPosition.y - rect.y,
    }
  }

  public move(point: PointData) {
    this.x = point.x
    this.y = point.y
  }

  public rotate(angle: number) {
    this._angle = angle
  }

  public moveToTop() { }
  public moveUp() { }
  public moveDown() { }
  public moveToBottom() { }

  public moveTo(newContainer: Node) {
    this._parent = newContainer
  }

  public getParent() {
    return this._parent
  }

  public getLayer() {
    return this._layer
  }

  public getStage() {
    return this._stage
  }

  public fire(eventType: string, event?: Record<string, unknown>, bubble?: boolean) { }

  public getClassName() {
    return this._classNames.join(" ")
  }

  public addName(className: string) {
    this._classNames.push(className.replaceAll(" ", ""))
  }

  public hasName(className: string) {
    return this._classNames.includes(className)
  }

  public removeName(className: string) {
    return this._classNames = getListWithoutItem(this._classNames, className)
  }

  public stratDrag() {
    this._isDragging = true
  }

  public stopDragging() {
    this._isDragging = false
  }

  public isDragging() {
    return this._isDragging
  }

  public isClientRectOnScreen() { }

  public scale(scaleX: number, scaleY?: number): void
  public scale(scaleX: number, scaleY: number) {
    const allApply = isNotUndefined(scaleX) && isNotUndefined(scaleY)

    this._scaleX = allApply ? scaleX : scaleX
    this._scaleY = allApply ? scaleY : scaleX
  }
}