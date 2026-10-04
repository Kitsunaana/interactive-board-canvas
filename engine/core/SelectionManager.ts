import {Container} from "./Container";
import {Shape} from "./Shape";
import {SYSTEM_UI} from "../world/GradientControls/BaseGradientGroup";
import {Node} from "./Node";
import {Group} from "./Group";
import {Layer} from "./Layer";

const invalidIndex = (index: number, list: Array<unknown>) => {
  return index > list.length - 1
}

type SelectableNode = Container | Shape

export class ContextModel {
  private _content = document.createElement("div")

  private target: Shape | null = null

  private _context: Container | null = null
  private _selected: Set<SelectableNode> = new Set()
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
    this._setupBreadcrumbsContent()

    window.addEventListener("click", () => {
      const target = this._layer.getIntersection(this._layer.worldPointer)
      if (Shape.isShape(target)) this._click(target)
    })

    window.addEventListener("dblclick", () => {
      const target = this._layer.getIntersection(this._layer.worldPointer)
      if (Shape.isShape(target)) this._dblclick(target)
    })
  }

  private _getPathToTarget(target: Node) {
    return target
      .getAllParents()
      .filter((node) => !node.hasName(SYSTEM_UI))
      .reverse()
  }

  private select(node: SelectableNode) {
    const shift = false
    const ctrl = false

    if (ctrl && this.target) {

      if (shift) {
        this._selected.add(this.target)

        this.target.drawBounds = true

      } else {

        this._selected.forEach((node) => node.drawBounds = false)
        this._selected.clear()
        this._selected.add(this.target)

        this.target.drawBounds = true

      }

    } else {

      this._selected.forEach((node) => {
        const parentId = node.getDataAttr<string>("parentId")

        node.removeDataAttr("parentId")
        const parent = this._layer.findParentById(parentId)
        // if (parent) node.moveTo(parent)

        node.drawBounds = false
      })

      this._selected.clear()

      this._selected.add(node)
      // node.setDataAttr("parentId", node.parent?.id)
      // node.moveTo(this._resizeGroup)
      node.drawBounds = true

    }

  }

  private _dblclick(target: Shape) {
    if (this.context) {
      this.target = target
      const pathToTarget = this._getPathToTarget(target)

      const currentContextIndex = pathToTarget.indexOf(this.context)
      const nextContextIndex = currentContextIndex + 1
      const isNextContextNotExist = nextContextIndex > pathToTarget.length - 1

      if (!isNextContextNotExist) {
        this.context = pathToTarget[nextContextIndex]
        this.select(this._context!)
      } else {
        this.isFinishTarget = true
        this.select(target)
      }
    }
  }

  private _click(target: Shape) {
    if (!this.context) return this._initializeLayerContext(target)

    if (this._tryHandleSiblingSelection(target)) return
    if (this._tryHandleAncestorSelection(target)) return
  }

  private _tryHandleSiblingSelection(clickedShape: Shape) {
    const currentShape = this.target!

    const referenceNode = this.isFinishTarget ? currentShape : this.context!
    const siblingNodes = this._getSiblingsOfNode(referenceNode.parentOrThrow, referenceNode)

    if (siblingNodes.includes(clickedShape)) {
      this.target = clickedShape
      this.context = clickedShape.parentOrThrow
      this.isFinishTarget = true
      this.select(clickedShape)

      return true
    }

    const parentContainerAmongSiblings = siblingNodes.find(
      (neighbor) => Group.isGroup(neighbor) && this._doesContainerHoldNode(neighbor, clickedShape)
    ) as Group | undefined

    if (parentContainerAmongSiblings) {
      this.target = clickedShape
      this.context = parentContainerAmongSiblings
      this.select(this.context)

      return true
    }
  }

  private _tryHandleAncestorSelection(clickedShape: Shape) {
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

      this.select(clickedShape)

      return true
    }
  }

  private _initializeLayerContext(clickedShape: Shape) {
    const ancestryPath = clickedShape.getAllParents().reverse()

    const layerIndex = ancestryPath.indexOf(this._layer)
    const nextIndex = layerIndex + 1

    this.target = clickedShape

    if (invalidIndex(nextIndex, ancestryPath)) {
      this.context = this._layer
      this.isFinishTarget = true
      this.select(clickedShape)
    } else {
      this.context = ancestryPath[nextIndex]
      this.select(this.context)
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

  private _setupBreadcrumbsContent() {
    this._content.style.position = "absolute"
    this._content.style.top = "0px"

    this._content.textContent = "Stage"

    document.body.appendChild(this._content)
  }
}
