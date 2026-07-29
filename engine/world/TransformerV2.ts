import { isNil } from "lodash";
import { Group } from "../Group";
import { Point } from "../maths";
import { ResizeTransformOpearation } from "./_transform/resize-operation";
import { RotateTransformOpearation } from "./_transform/rotate-operation";
import type { TransformState, TransformStrategy } from "./_transform/transform-operation.interface";
import { SimObject } from "./sim-object";

export class TransformerV2 extends Group implements TransformStrategy {
  public static isTransformer(candidate: unknown): candidate is TransformerV2 {
    return candidate instanceof TransformerV2
  }

  public _transformState: TransformState = "idle";

  public activeOperation: RotateTransformOpearation | ResizeTransformOpearation | null = null
  public rotateOperation: RotateTransformOpearation
  public resizeOperation: ResizeTransformOpearation

  private _processTransform(event: PointerEvent) { }
  private _finishTransform(event: PointerEvent) { }

  private get _isSingle(): boolean {
    return this.children().length === 1;
  }

  private get _child(): SimObject {
    return this.children()[0];
  }

  public get box(): SimObject {
    if (this._isSingle) return this._child;
    return this;
  }

  public get transformState() {
    return this._transformState
  }

  public set transformState(next: TransformState) {
    this.activeOperation = ({
      idle: () => null,
      rotate: () => this.rotateOperation,
      resize: () => this.resizeOperation,
    })[next]()

    this._transformState = next

    if (!isNil(this.activeOperation)) {
      this.removeTransformHandlersToWindow()
      this.subscribeTransformHandlersToWindow()
    }
  }

  public removeTransformHandlersToWindow() {
    window.removeEventListener("pointermove", this._processTransform)
    window.removeEventListener("pointerup", this._finishTransform)
  }

  public subscribeTransformHandlersToWindow() {
    const operation = this.activeOperation

    if (operation) {
      this._processTransform = operation.processTransform.bind(operation)
      this._finishTransform = operation.finishTransform.bind(operation)

      window.addEventListener("pointermove", this._processTransform)
      window.addEventListener("pointerup", this._finishTransform)
    }
  }

  public constructor() {
    super();

    this.rotateOperation = new RotateTransformOpearation(this)
    this.resizeOperation = new ResizeTransformOpearation(this)

    this.on("addToParent", () => {
      this.addHandlersToLayer()
      this.updateHandlersPosition()
    });

  }

  public updateAfterTransform(): void {
    super.updateAfterTransform()
    this.updateHandlersPosition()
  }

  public rotate(angle: number): void {
    if (this._isSingle) this._child.rotate(angle);
    else super.rotate(angle);
  }

  public scale(scale: Point): void {
    if (this._isSingle) this._child.scale(scale);
    else super.scale(scale);
  }

  public addHandlersToLayer() {
    const layer = this.layer()!

    this.resizeOperation.addHandlersToLayer(layer)
    this.rotateOperation.addHandlersToLayer(layer)
  }

  public updateHandlersPosition() {
    this.resizeOperation.updateHandlersPosition()
    this.rotateOperation.updateHandlersPosition()
  }

  public render(context: CanvasRenderingContext2D): void {
    const cachedMatrix = this.box.cachedMatrix

    context.save();
    cachedMatrix.applyToContext(context);
    super.render(context);
    context.restore();
  }
}
