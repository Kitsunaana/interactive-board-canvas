import type { Layer } from "./Layer"
import { Node, routes } from "./Node"
import type { Stage } from "./Stage"

export abstract class Container extends Node {
  private _children: Array<Node> = []

  private _stage_v2: Stage | null = null
  public get stage_v2() {
    return this._stage_v2!
  }
  public set stage_v2(parent: Stage) {
    this._stage_v2 = parent
    this.children.forEach((child) => {
      child.stage_v2 = parent
    })
  }

  private _layer_v2: Layer | null = null
  public get layer_v2() {
    return this._layer_v2!
  }
  public set layer_v2(parent: Layer) {
    this._layer_v2 = parent
    this.children.forEach((child) => {
      child.layer_v2 = parent
    })
  }

  public get children() {
    return this._children
  }

  public render(context: CanvasRenderingContext2D): void {
    this.children.forEach((child) => child.render(context))
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    this.children.forEach((child) => child.renderHit(context))
  }

  public updateWorldTransform(): void {
    super.updateWorldTransform()
    this.children.forEach((child) => child.updateWorldTransform())
  }

  public destroy() {
    super.destroy()
    this.children.forEach((child) => this.destroy())
  }

  public removeChild(child: Node) {
    const index = this._children.indexOf(child)
    if (index === -1) throw new Error("child not found")
    child.parent = null

    this._children.splice(index, 1)
    this.emitter.emit(routes.removeChild({ child }))
  }

  public appendChild(...list: Array<Node>) {
    list.forEach((child) => {
      this._children.push(child)
      this.emitter.emit(routes.addChild({ child }))

      child.parent = this
      child.emitter.emit(routes.addToParent({ parent: this }))
    })
  }
}