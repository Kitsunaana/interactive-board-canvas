import {Container} from "./Container";
import {Shape} from "./Shape";
import {SYSTEM_UI} from "../world/GradientControls/BaseGradientGroup";
import {Node} from "./Node";
import {Group} from "./Group";
import {Layer} from "./Layer";

const invalidIndex = (index: number, list: Array<unknown>) => {
  return index > list.length - 1
}

export type SelectableNode = Container | Shape

export type OnNodeSelect = (node: SelectableNode) => void

export class ContextModel {
  private _content = document.createElement("div")

  private target: Shape | null = null

  private _context: Container | null = null
  private _isFinishTarget: boolean = false

  private get context() {
    return this._context
  }

  private get isFinishTarget(): boolean {
    return this._isFinishTarget
  }

  private set isFinishTarget(value: boolean) {
    const prev = this._isFinishTarget
    this._isFinishTarget = value

    if (prev !== value) {
      this._content.textContent += " > Shape"
    }
  }

  private set context(value: Container | null) {
    this._context = value
    this._isFinishTarget = false

    if (value) {
      const pathToTarget = this._getPathToTarget(this.target!)
      const index = pathToTarget.indexOf(value)
      this._content.textContent = pathToTarget
        .slice(0, index + 1)
        .map(p => p.type)
        .join(" > ")
    }
  }

  public constructor(private readonly _layer: Layer) {
  }

  private _getPathToTarget(target: Node) {
    return target
      .getAllParents()
      .filter((node) => !node.hasName(SYSTEM_UI))
      .reverse()
  }
  
  public dblclick(target: Shape, onSelect: OnNodeSelect) {
    if (this.context) {
      this.target = target
      const pathToTarget = this._getPathToTarget(target)

      const currentContextIndex = pathToTarget.indexOf(this.context)
      const nextContextIndex = currentContextIndex + 1
      const isNextContextNotExist = nextContextIndex > pathToTarget.length - 1

      if (!isNextContextNotExist) {
        this.context = pathToTarget[nextContextIndex]
        onSelect(this._context!)
      } else {
        this.isFinishTarget = true
        onSelect(target)
      }
    }
  }

  public click(target: Shape, onSelect: OnNodeSelect) {
    if (!this.context) return this._initializeLayerContext(target, onSelect)

    if (this._tryHandleSiblingSelection(target, onSelect)) return
    if (this._tryHandleAncestorSelection(target, onSelect)) return
  }

  private _tryHandleSiblingSelection(clickedShape: Shape, onSelect: OnNodeSelect) {
    const currentShape = this.target!

    const referenceNode = this.isFinishTarget ? currentShape : this.context!
    const siblingNodes = this._getSiblingsOfNode(referenceNode.parentOrThrow, referenceNode)

    if (siblingNodes.includes(clickedShape)) {
      this.target = clickedShape
      this.context = clickedShape.parentOrThrow
      this.isFinishTarget = true
      onSelect(clickedShape)

      return true
    }

    const parentContainerAmongSiblings = siblingNodes.find(
      (neighbor) => Group.isGroup(neighbor) && this._doesContainerHoldNode(neighbor, clickedShape)
    ) as Group | undefined

    if (parentContainerAmongSiblings) {
      this.target = clickedShape
      this.context = parentContainerAmongSiblings
      onSelect(this.context)

      return true
    }
  }

  private _tryHandleAncestorSelection(clickedShape: Shape, onSelect: OnNodeSelect) {
    const currentShape = this.target!
    if (currentShape === clickedShape) return

    const clickedShapeDepth = this._getNodeDepth(clickedShape)
    const currentContextDepth = this._getNodeDepth(this.context!)

    if (currentContextDepth < clickedShapeDepth) return

    const referenceNode = this.isFinishTarget ? currentShape : this.context!
    const referenceParents = referenceNode.getAllParents()
    const sharesAncestryPath = clickedShape
      .getAllParents()
      .every((parent) => referenceParents.includes(parent))

    if (sharesAncestryPath) {
      this.target = clickedShape
      this.context = clickedShape.parentOrThrow
      this.isFinishTarget = true

      onSelect(clickedShape)

      return true
    }
  }

  private _initializeLayerContext(clickedShape: Shape, onSelect: OnNodeSelect) {
    const ancestryPath = clickedShape.getAllParents().reverse()

    const layerIndex = ancestryPath.indexOf(this._layer)
    const nextIndex = layerIndex + 1

    this.target = clickedShape

    if (invalidIndex(nextIndex, ancestryPath)) {
      this.context = this._layer
      this.isFinishTarget = true
      onSelect(clickedShape)
    } else {
      this.context = ancestryPath[nextIndex]
      onSelect(this.context)
    }
  }

  private _getSiblingsOfNode(parent: Container, node: Node): Array<Node> {
    const children = parent.children
    const foundIndex = children.indexOf(node)
    if (foundIndex === -1) return children
    const prev = children.slice(0, foundIndex)
    const next = children.slice(foundIndex + 1)
    return prev.concat(next)
  }

  private _getNodeDepth(node: SelectableNode): number {
    return node.getAllParents().length
  }

  private _doesContainerHoldNode(container: Container, node: SelectableNode): boolean {
    return node.getAllParents().includes(container)
  }
}
