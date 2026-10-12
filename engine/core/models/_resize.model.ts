import {Layer} from "../Layer";
import {ResizeTransformer} from "../../world/TransformerV2";
import type {SelectableNode} from "../SelectionManager";
import {ResizeTransformOperation} from "../../world/_transform/resize-operation";
import {SimObject} from "../SimObject";

export class ResizeTransformModel {
  public selected: Set<SelectableNode> = new Set()

  public group: ResizeTransformer
  public operation: ResizeTransformOperation = new ResizeTransformOperation()

  public constructor(private readonly layer: Layer) {
    this.group = new ResizeTransformer(this.layer)
  }

  public select(context: SimObject, ...nodes: Array<SimObject>) {
    this.group.initialize(nodes, context)
    this.operation.initialize(this.group.buildContext())
  }

  public destroy() {
    this.selected.clear()
    this.group.removeObjects()
  }
}
