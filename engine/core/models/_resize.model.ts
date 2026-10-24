import {Layer} from "../Layer";
import {ResizeTransformer} from "../../world/TransformerV2";
import {ResizeTransformOperation} from "../../world/_transform/resize-operation";
import type {SimObject} from "../SimObject";
import type {Container} from "../Container";
import {inject, injectable} from "inversify";
import {Background} from "../../world/BG";

@injectable()
export class ResizeTransformService {
  public group: ResizeTransformer
  public operation: ResizeTransformOperation = new ResizeTransformOperation()

  public constructor(@inject(Background) private readonly _layer: Layer) {
    this.group = new ResizeTransformer(this._layer)
  }

  public select(context: Container, ...nodes: Array<SimObject>) {
    this.group.initialize(nodes, context)
    this.operation.initialize(this.group.buildContext())
  }

  public destroy() {
    // this.selected.clear()
    this.group.removeObjects()
  }
}
