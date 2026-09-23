import { Node, routes } from "./Node"

export abstract class Container extends Node {
  private _children: Array<Node> = []

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
    this.children.forEach(this.updateWorldTransform.call)
  }

  public destroy() {
    super.destroy()
    this.children.forEach(this.destroy.call)
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