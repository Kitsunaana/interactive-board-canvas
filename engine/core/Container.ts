import type { Layer } from "./Layer"
import { Node, routes } from "./Node"
import type { Stage } from "./Stage"
import { Shape } from "./Shape";

export abstract class Container extends Node {
  public static isContainer(candidate: unknown): candidate is Container {
    return candidate instanceof Container
  }

  private _children: Array<Node> = []

  private _stage: Stage | null = null
  private _layer: Layer | null = null

  public get stage() {
    return this._stage!
  }

  public get layer() {
    return this._layer!
  }

  public set stage(parent: Stage) {
    this._stage = parent
    this.children.forEach((child) => {
      child.stage = parent
    })
  }

  public set layer(parent: Layer) {
    this._layer = parent
    this.children.forEach((child) => {
      child.layer = parent
    })
  }

  public get children() {
    return this._children
  }

  public render(context: CanvasRenderingContext2D): void {
    if (!this.isVisible) return
    this.children.forEach((child) => child.render(context))
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    if (!this.isListening) return
    this.children.forEach((child) => child.renderHit(context))
  }

  public updateWorldTransform(): void {
    super.updateWorldTransform()
    this.children.forEach((child) => child.updateWorldTransform())
  }

  public destroy() {
    super.destroy()
    this.children.forEach((child) => child.destroy())
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
      if (this.layer) child.layer = this.layer
      if (this.stage) child.stage = this.stage

      this._children.push(child)
      this.emitter.emit(routes.addChild({ child }))

      child.parent = this
      child.emitter.emit(routes.addToParent({ parent: this }))
    })
  }

  public getShapes(): Array<Shape> {
    return this.children.flatMap(child => {
      if (Shape.isShape(child)) return child
      return this.getShapes.call(child)
    })
  }

  public findParentById(parentId: string): Container | undefined {
    if (this.id === parentId) return this

    return this.children.find((child) => {
      if (Container.isContainer(child)) {
        return child.id === parentId
          ? true
          : Container.prototype.findParentById.call(child, parentId)
      }

      return false
    }) as Container | undefined
  }
}
