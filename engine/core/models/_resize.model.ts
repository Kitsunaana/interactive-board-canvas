import { Layer } from "../Layer";
import { ResizeTransformer } from "../../world/TransformerV2";
import type { SelectableNode } from "../SelectionManager";
import { ResizeTransformOperation } from "../../world/_transform/resize-operation";
import {SimObject} from "../SimObject";

export class ResizeTransformModel {
  public selected: Set<SelectableNode> = new Set()

  public group: ResizeTransformer = new ResizeTransformer()
  public operation: ResizeTransformOperation = new ResizeTransformOperation()

  public constructor(private readonly layer: Layer) {
    this.layer.appendChild(this.group)
  }

  public create(node: SimObject) {
    this.group.setShapes([node])
    this.operation.initialize(this.group, node)
  }

  public destroy() {
    this.group.removeShapes()
  }
}
