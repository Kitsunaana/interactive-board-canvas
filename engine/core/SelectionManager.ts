import { Container } from "./Container";
import { Shape } from "./Shape";
import { SYSTEM_UI } from "../world/GradientControls/BaseGradientGroup";
import { Group } from "./Group";
import { SimObject } from "./SimObject";
import { inject, injectable } from "inversify";
import { Background } from "../world/BG";

const invalidIndex = (index: number, list: Array<unknown>) => {
  return index > list.length - 1
}

export type SelectableNode = Container | Shape

export type OnNodeSelect = (params: {
  context: Container
  objects: Array<SimObject>
}) => void

export type SelectParams = {
  onSelect: OnNodeSelect
  multiselectMode: boolean
  targetMode: boolean
  target: Shape
}

@injectable()
export class ContextModel {
  private _target: Shape | null = null
  private _context: Container | null = null
  private _isFinishTarget: boolean = false

  public selected: Set<SelectableNode> = new Set()

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

  public layer!: Background

  // public constructor(@inject(Background) private readonly _layer: Background) { }

  public contextExit() {
    this._isFinishTarget = false
    this._context = null
  }

  private _replaceSelection(...objects: Array<SelectableNode>) {
    this.selected.clear()
    objects.forEach(object => this.selected.add(object))
  }

  public dblclick({ target, targetMode, multiselectMode, onSelect }: SelectParams) {
    if (targetMode || multiselectMode) return

    if (this.context) {
      this._target = target

      const pathToTarget = this._getPathToTarget(target)
      const currentContextIndex = pathToTarget.indexOf(this.context)
      const nextContextIndex = currentContextIndex + 1
      const isNextContextNotExist = nextContextIndex > pathToTarget.length - 1

      if (!isNextContextNotExist) {
        this.context = pathToTarget[nextContextIndex]
        this._replaceSelection(this.context)
        onSelect(this._formatSelectParams())
      } else {
        this.isFinishTarget = true
        this._replaceSelection(target)
        onSelect(this._formatSelectParams())
      }
    }
  }

  public click({ target, targetMode, multiselectMode, onSelect }: SelectParams) {
    if (targetMode && multiselectMode) {
      this._target = target

      if (this.selected.has(target)) {
        this.selected.size > 1 && this.selected.delete(target)
      } else {
        const targetParents = target.getAllParents()
        const foundSelectedParent = Array
          .from(this.selected)
          .find((node: SelectableNode) => Group.isGroup(node) && targetParents.includes(node))

        if (foundSelectedParent) this.selected.delete(foundSelectedParent)

        this.selected.add(target)
      }

      this.context = this._findCommonParent(Array.from(this.selected))
      return onSelect(this._formatSelectParams())
    }

    if (targetMode) {
      this._target = target
      this.selected.clear()
      this.selected.add(target)
      this.context = target.parent!
      return onSelect(this._formatSelectParams())
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

      this._replaceSelection(clickedShape)
      onSelect(this._formatSelectParams())

      return true
    }

    const parentContainerAmongSiblings = siblingNodes.find(
      (neighbor) => Group.isGroup(neighbor) && this._doesContainerHoldNode(neighbor, clickedShape)
    ) as Group | undefined

    if (parentContainerAmongSiblings) {
      this._target = clickedShape
      this.context = parentContainerAmongSiblings

      this._replaceSelection(this.context)
      onSelect(this._formatSelectParams())

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

      this._replaceSelection(clickedShape)
      onSelect(this._formatSelectParams())

      return true
    }
  }

  private _initializeLayerContext(clickedShape: Shape, onSelect: OnNodeSelect) {
    const ancestryPath = clickedShape.getAllParents().reverse()

    const layerIndex = ancestryPath.indexOf(this.layer)
    const nextIndex = layerIndex + 1

    this._target = clickedShape

    if (invalidIndex(nextIndex, ancestryPath)) {
      this.context = this.layer
      this.isFinishTarget = true

      this._replaceSelection(clickedShape)
      onSelect(this._formatSelectParams())
    } else {
      this.context = ancestryPath[nextIndex]

      this._replaceSelection(this.context)
      onSelect(this._formatSelectParams())
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

  private _findCommonParent(candidates: Array<SimObject>): Container {
    if (candidates.length === 1) return candidates[0].parent!

    const first = candidates[0]
    const other = candidates.slice(1)

    const firstObjectParents = first.getAllParents()

    return firstObjectParents.find((parent) => {
      return other.every((object) => (
        object
          .getAllParents()
          .includes(parent)
      ))
    }) ?? this.layer
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

  private _formatSelectParams(): Parameters<OnNodeSelect>[0] {
    return {
      context: this.context!,
      objects: Array.from(this.selected)
    }
  }
}
