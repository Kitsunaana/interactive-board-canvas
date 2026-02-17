import { isFunction } from "lodash"

type Node = {
  getType: () => "Container" | "Node" | "Shape" | "Group"
  getClassName: () => string
}

export class Container {
  private readonly _type = "Container"

  private _children: Array<Node> = []

  public getType() {
    return this._type
  }

  public getChildren(filterFn?: (node: Node) => boolean) {
    if (isFunction(filterFn)) return this._children.filter(filterFn)
    return this._children
  }

  public hasChildren() {
    return this._children.length > 0
  }
}