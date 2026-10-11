import {Container} from "./Container";
import {Shape} from "./Shape";
import {SYSTEM_UI} from "../world/GradientControls/BaseGradientGroup";
import {Group} from "./Group";
import {Layer} from "./Layer";
import {SimObject} from "./SimObject";
import {isNull} from "lodash";

const invalidIndex = (index: number, list: Array<unknown>) => {
  return index > list.length - 1
}

export type SelectableNode = Container | Shape

export type OnNodeSelect = (node: SelectableNode) => void

export class ContextModel {
  private _target: Shape | null = null
  private _context: Container | null = null
  private _isFinishTarget: boolean = false

  public get target(): Shape | null {
    return this._target
  }

  public get context() {
    return this._context
  }

  public get isFinishTarget(): boolean {
    return this._isFinishTarget
  }

  private set isFinishTarget(value: boolean) {
    this._isFinishTarget = value
  }

  private set context(value: Container | null) {
    this._context = value
    this._isFinishTarget = false
  }

  public constructor(private readonly _layer: Layer) {
  }

  public contextExit() {
    this._isFinishTarget = false
    this._context = null
  }

  public dblclick(target: Shape, onSelect: OnNodeSelect) {
    if (this.context) {
      this._target = target
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

  private _findCommonParent(first: SimObject, second: SimObject) {
    const firstParents = first.getAllParents()
    const secondParents = second.getAllParents()

    const foundParent = secondParents.find((parent) => firstParents.includes(parent))
    return foundParent ?? this._layer
  }

  public click(target: Shape, onSelect: OnNodeSelect) {

    const targetMode = true
    const multiselect = true

    if (targetMode && multiselect) {
      const prevTarget = this._target
      const nextTarget = target

      if (isNull(prevTarget)) {
        this.context = target.parent
        this.isFinishTarget = true
        this._target = target
        onSelect(target)
      } else {
        this.context = this._findCommonParent(prevTarget, nextTarget)
        this._target = nextTarget
        onSelect(target)
      }
      
      return
    }

    if (targetMode) {
      this._target = target

      this.context = target.parent
      this.isFinishTarget = true

      onSelect(target)
      return
    }

    if (!this.context) return this._initializeLayerContext(target, onSelect)

    if (this._tryHandleSiblingSelection(target, onSelect)) return
    if (this._tryHandleAncestorSelection(target, onSelect)) return
  }

  private _tryHandleSiblingSelection(clickedShape: Shape, onSelect: OnNodeSelect) {
    const currentShape = this._target!

    const referenceNode = this.isFinishTarget ? currentShape : this.context!
    const siblingNodes = this._getSiblingsOfNode(referenceNode.parent!, referenceNode)

    if (siblingNodes.includes(clickedShape)) {
      this._target = clickedShape
      this.context = clickedShape.parent!
      this.isFinishTarget = true
      onSelect(clickedShape)

      return true
    }

    const parentContainerAmongSiblings = siblingNodes.find(
      (neighbor) => Group.isGroup(neighbor) && this._doesContainerHoldNode(neighbor, clickedShape)
    ) as Group | undefined

    if (parentContainerAmongSiblings) {
      this._target = clickedShape
      this.context = parentContainerAmongSiblings
      onSelect(this.context)

      return true
    }
  }

  private _tryHandleAncestorSelection(clickedShape: Shape, onSelect: OnNodeSelect) {
    const currentShape = this._target!
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
      this._target = clickedShape
      this.context = clickedShape.parent!
      this.isFinishTarget = true

      onSelect(clickedShape)

      return true
    }
  }

  private _initializeLayerContext(clickedShape: Shape, onSelect: OnNodeSelect) {
    const ancestryPath = clickedShape.getAllParents().reverse()

    const layerIndex = ancestryPath.indexOf(this._layer)
    const nextIndex = layerIndex + 1

    this._target = clickedShape

    if (invalidIndex(nextIndex, ancestryPath)) {
      this.context = this._layer
      this.isFinishTarget = true
      onSelect(clickedShape)
    } else {
      this.context = ancestryPath[nextIndex]
      onSelect(this.context)
    }
  }

  private _getSiblingsOfNode(parent: Container, node: SimObject): Array<SimObject> {
    const children = parent.children
    const foundIndex = children.indexOf(node)
    if (foundIndex === -1) return children
    const prev = children.slice(0, foundIndex)
    const next = children.slice(foundIndex + 1)
    return prev.concat(next)
  }

  private _getPathToTarget(target: SimObject) {
    return target
      .getAllParents()
      .filter((node) => !node.hasName(SYSTEM_UI))
      .reverse()
  }

  private _getNodeDepth(node: SelectableNode): number {
    return node.getAllParents().length
  }

  private _doesContainerHoldNode(container: Container, node: SelectableNode): boolean {
    return node.getAllParents().includes(container)
  }
}
