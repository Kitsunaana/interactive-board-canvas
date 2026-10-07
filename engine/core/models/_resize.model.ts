import {isNil} from "lodash";
import {Layer} from "../Layer";
import {Node} from "../Node";
import {ResizeTransformer} from "../../world/TransformerV2";
import {ResizeTransformOperation} from "../../world/_transform/resize-operation";
import type {SelectableNode} from "../SelectionManager";

export type ResizeTransformModelState = {
  operation: ResizeTransformOperation
  group: ResizeTransformer
  layer: Layer
}

export class ResizeTransformModel {
  private _state: ResizeTransformModelState | null = null

  public selected: Set<SelectableNode> = new Set()

  public get state() {
    if (isNil(this._state)) throw new Error("_state is not initialized")
    return this._state
  }

  public constructor(private readonly layer: Layer) {
  }

  public create(node: Node) {
    const layer = this.layer.createTempLayer()
    // layer.delegateEvents(this.layer)
    layer.isListening = false

    node.isVisible = false
    const cloneNode = node.clone()

    const group = new ResizeTransformer()
    group.appendChild(cloneNode)
    layer.appendChild(group)

    const operation = new ResizeTransformOperation(group, cloneNode)

    this._state = {
      operation,
      group,
      layer,
    }
  }

  public destroy() {
    if (this._state) {
      this.selected.forEach((node) => {
        node.isVisible = true
      })

      this._state.group.destroy()
      this._state.layer.destroy()
      
      this._state = null
    }
  }
}
