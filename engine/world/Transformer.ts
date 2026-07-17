import { isNil, isUndefined, mapKeys } from "lodash";
import type { EventObject } from "../behaviors/EventBehavior";
import { Group } from "../Group";
import { Matrix3x3, Point, type PointData, Rectangle } from "../maths";
import { Ellipse } from "../shapes/Ellipse";
import { PolygonShape } from "../shapes/Polygon";
import { Shape } from "../shapes/Shape";
import { pointFromEvent } from "../shared/point";
import { SimObject } from "./sim-object";
import { drawOriginPoint } from "../behaviors/Transformable";

// n - Верхняя
// e - Правая
// s - Нижняя
// w - Левая

// nw - Верхняя левая
// ne - Верхняя правая
// se - Нижняя правая
// sw - Нижняя левая
export type ResizeHandler = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type Edge = "top" | "right" | "bottom" | "left";

const RESIZE_HANDLER_CLASSNAMES = [
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
  "bottom",
  "right",
  "left",
  "top"
]

export class Transformer extends Group {
  private readonly _initialOBB = new Rectangle();
  private readonly _obbWorldCenter = new Point();
  private readonly _handlePosition = new Point();
  private readonly _transformScale = new Point(1, 1);
  private readonly _pivotPosition = new Point();
  private readonly _worldPivot = new Point();

  private _pickedHandler: ResizeHandler | null = null;
  private _proportional: boolean = false
  private _padding = 7;

  private readonly _transformHandlerShapes: Record<Edge | Corner, Shape> = {
    bottom: new PolygonShape({ initialPoints: [] }),
    right: new PolygonShape({ initialPoints: [] }),
    left: new PolygonShape({ initialPoints: [] }),
    top: new PolygonShape({ initialPoints: [] }),

    "bottom-right": new Ellipse(0, 0, 5, 5),
    "bottom-left": new Ellipse(0, 0, 5, 5),
    "top-right": new Ellipse(0, 0, 5, 5),
    "top-left": new Ellipse(0, 0, 5, 5),
  };

  private get _isSingle(): boolean {
    return this.children().length === 1;
  }

  private get _child(): SimObject {
    return this.children()[0];
  }

  private get _boxToApplyModify(): SimObject {
    if (this._isSingle) return this._child;
    return this;
  }

  public constructor() {
    super();

    this.on("addToParent", this._registerTransformHandlerShapes.bind(this));

    window.addEventListener("pointermove", this._processResize.bind(this));
    window.addEventListener("pointerup", this._finishResize.bind(this));
  }

  public updateAfterTransform(): void {
    super.updateAfterTransform()
    this.updateTransformHandlerShapes()
  }

  public rotate(angle: number): void {
    if (this._isSingle) this._child.rotate(angle);
    else super.rotate(angle);
  }

  public scale(scale: Point): void {
    if (this._isSingle) this._child.scale(scale);
    else super.scale(scale);
  }

  private _startTransform() {
    this._setInitialState();
    this._setPivotPosition(this._pickedHandler!);
    this._setHandlePosition(this._pickedHandler!);
    this._setWorldPivot();
  }

  private _getHandler(handler: string): ResizeHandler {
    const isFlippedX = this._boxToApplyModify.worldMatrix.a < 0;
    const isFlippedY = this._boxToApplyModify.worldMatrix.d < 0;

    const t = {
      bottom: isFlippedY ? "n" : "s",
      right: isFlippedX ? "w" : "e",
      left: isFlippedX ? "e" : "w",
      top: isFlippedY ? "s" : "n",

      "bottom-right": [isFlippedY ? "n" : "s", isFlippedX ? "w" : "e"].join(""),
      "bottom-left": [isFlippedY ? "n" : "s", isFlippedX ? "e" : "w"].join(""),
      "top-right": [isFlippedY ? "s" : "n", isFlippedX ? "w" : "e"].join(""),
      "top-left": [isFlippedY ? "s" : "n", isFlippedX ? "e" : "w"].join(""),
    }[handler] as ResizeHandler;

    return t
  }

  private _pointerDownTransformHandler(event: EventObject<Event>) {
    const include = RESIZE_HANDLER_CLASSNAMES.includes.bind(event.target.classList)
    const handler = event.target.classList.find(include)
    if (isUndefined(handler)) return

    if (event.evt instanceof PointerEvent) {
      this._proportional = event.evt.shiftKey
    }

    this._pickedHandler = this._getHandler(handler);
    this._startTransform();

    this._boxToApplyModify.setOrigin("scale", this._getRelativeOriginScale(this._pickedHandler));
    this._boxToApplyModify.beginInteraction("scale");
  }

  private _registerTransformHandlerShapes() {
    const layer = this.layer();
    if (isNil(layer)) return;

    const boundaries = this._calculateTransformHandlerPositions();

    mapKeys(this._transformHandlerShapes, (shape, handler) => {
      this._moveTransformHandlerShape(shape, handler, boundaries)

      shape.addClassname(handler);
      shape.on("pointerdown", this._pointerDownTransformHandler.bind(this));

      layer.add(shape);
    });
  }

  private _moveTransformHandlerShape(shape: SimObject, handler: string, boundaries: ReturnType<typeof this._calculateTransformHandlerPositions>) {
    if (PolygonShape.isPolygon(shape)) {
      shape.pointsToTrace = boundaries[handler as Edge];
    }

    if (Ellipse.isEllipse(shape)) {
      const position = boundaries[handler as Corner];
      shape.change(position.x, position.y, 5, 5);
    }
  }

  public updateTransformHandlerShapes() {
    const boundariesPositions = this._calculateTransformHandlerPositions();

    mapKeys(this._transformHandlerShapes, (shape, handler) => {
      this._moveTransformHandlerShape(shape, handler, boundariesPositions)
    })
  }

  private _processResize(event: PointerEvent) {
    if (isNil(this._pickedHandler)) return;

    this._proportional = event.shiftKey

    this._boxToApplyModify.setOrigin("scale", this._getRelativeOriginScale(this._pickedHandler));
    this._setTransformScale(pointFromEvent(event), this._pickedHandler);
    this._boxToApplyModify.updateInteraction(this._transformScale);

    const layer = this.layer();
    if (isNil(layer)) return

    this.updateTransformHandlerShapes()
  }

  private _calculateTransformHandlerPositions() {
    const matrix = this._boxToApplyModify.isInteracting
      ? Matrix3x3.compose(this._boxToApplyModify.cachedMatrix, this._boxToApplyModify.localMatrix)
      : this._boxToApplyModify.worldMatrix

    const bounds = this._boxToApplyModify.getBounds({ skipTransform: true });
    const angle = Math.atan2(Math.abs(matrix.b), Math.abs(matrix.a))

    const corners = bounds.getCorners().map((point) =>  matrix.applyToPoint(point));

    const rotated = Matrix3x3.rotate(angle);

    const padding = [
      { x: -this._padding, y: -this._padding },
      { x: this._padding, y: -this._padding },
      { x: this._padding, y: this._padding },
      { x: -this._padding, y: this._padding },
    ].map((value) => {
      value.x *= matrix.a < 0 ? -1 : 1;
      value.y *= matrix.d < 0 ? -1 : 1;

      return value;
    });

    const rotate = (index: number) => corners[index].add(rotated.applyToPoint(padding[index]));

    const mappedCorners = [rotate(0), rotate(1), rotate(2), rotate(3)];

    return {
      bottom: [mappedCorners[2], mappedCorners[3]],
      right: [mappedCorners[1], mappedCorners[2]],
      left: [mappedCorners[3], mappedCorners[0]],
      top: [mappedCorners[0], mappedCorners[1]],
      
      "bottom-right": mappedCorners[2],
      "bottom-left": mappedCorners[3],
      "top-right": mappedCorners[1],
      "top-left": mappedCorners[0],
    } as Record<Edge, Array<PointData>> & Record<Corner, PointData>;
  }

  private _finishResize() {
    this._boxToApplyModify.endInteraction();
    this._transformScale.copyFrom(Point.one());
    this._pickedHandler = null;

    this.updateTransformHandlerShapes()
  }

  public render(context: CanvasRenderingContext2D): void {
    const cachedMatrix = this._boxToApplyModify.cachedMatrix

    context.save();
    cachedMatrix.applyToContext(context);
    super.render(context);
    context.restore();

    this.children().map((child) => {
      const bounds = child.getBounds({ skipTransform: true });
      const matrix = Matrix3x3.compose(cachedMatrix, child.worldMatrix);

      const corners = bounds.getCorners().map(matrix.applyToPoint.bind(matrix));

      context.beginPath();
      PolygonShape.prototype.traceLinearPath.call({ pointsToTrace: corners }, context)
      context.closePath();
      context.stroke();
      context.restore();
    });
  }

  private _getRelativeOriginScale(side: ResizeHandler) {
    const relativeOrigin = new Point();

    switch (side) {
      case "n":
        if (this._proportional) relativeOrigin.set(0.5, 1);
        else relativeOrigin.set(0, 1);
        break;
      case "e":
        if (this._proportional) relativeOrigin.set(0, 0.5);
        else relativeOrigin.set(0, 0);
        // relativeOrigin.set(0.5, 0.5)
        break;
      case "s":
        if (this._proportional) relativeOrigin.set(0.5, 0);
        else relativeOrigin.set(1, 0);
        break;
      case "w":
        if (this._proportional) relativeOrigin.set(1, 0.5);
        else relativeOrigin.set(1, 0);
        break;
      case "nw":
        relativeOrigin.set(1, 1);
        break;
      case "ne":
        relativeOrigin.set(0, 1);
        break;
      case "se":
        relativeOrigin.set(0, 0)
        break;
      case "sw":
        relativeOrigin.set(1, 0);
        break;
    }

    const matrix = this._boxToApplyModify.worldMatrix;

    relativeOrigin.set(
      matrix.a < 0 ? 1 - relativeOrigin.x : relativeOrigin.x,
      matrix.d < 0 ? 1 - relativeOrigin.y : relativeOrigin.y,
    );

    return relativeOrigin;
  }

  private _getPaddingToLocalCursor(side: ResizeHandler) {
    const padding = this._padding;

    let point: Point;

    switch (side) {
      case "nw":
        point = new Point(padding, padding);
        break;
      case "n":
        point = new Point(padding, padding);
        break;
      case "ne":
        point = new Point(-padding, padding);
        break;
      case "e":
        point = new Point(-padding, padding);
        break;
      case "se":
        point = new Point(-padding, -padding);
        break;
      case "s":
        point = new Point(padding, -padding);
        break;
      case "sw":
        point = new Point(padding, -padding);
        break;
      case "w":
        point = new Point(padding, -padding);
        break;
    }

    point.x *= Math.sign(this._boxToApplyModify.worldMatrix.a);
    point.y *= Math.sign(this._boxToApplyModify.worldMatrix.a);

    return point;
  }

  private _computeDeadZoneAdjustedFactor(
    referenceScale: Point,
    pointerOffset: Point,
    axis: keyof PointData,
  ): number {
    const deadZoneThreshold: number = this._padding * 2;

    if (referenceScale[axis] !== 0) {
      const initialRatio = pointerOffset[axis] / referenceScale[axis];

      if (initialRatio > 0) return Math.max(0.01, initialRatio);
      else if (Math.abs(pointerOffset[axis]) <= deadZoneThreshold) return 0;
      else {
        const deadZoneAdjustedValue = pointerOffset[axis] + Math.sign(referenceScale[axis]) * deadZoneThreshold;
        const adjustedRatio = deadZoneAdjustedValue / referenceScale[axis];

        return (
          Math.sign(adjustedRatio) * Math.max(0.01, Math.abs(adjustedRatio))
        );
      }
    }

    return 1;
  }

  private _setInitialState(): void {
    const bounds = new Rectangle(0, 0, 0, 0);

    if (Shape.isShape(this._boxToApplyModify)) {
      this._boxToApplyModify.getUnrotateBounds().copyTo(bounds);
    }

    if (Group.isGroup(this._boxToApplyModify)) {
      this._boxToApplyModify.getUnrotateBounds().copyTo(bounds);
    }

    this._initialOBB.copyFrom(bounds);
    this._obbWorldCenter.copyFrom(this._initialOBB.center);
  }

  private _getCurrentAngleToTransform(): number {
    const cachedMatrix = this._boxToApplyModify.worldMatrix;
    const currentAngle = Math.atan2(cachedMatrix.b, cachedMatrix.a);

    return currentAngle;
  }

  private _setWorldPivot(): void {
    const pivotPosition = this._pivotPosition.clone();

    pivotPosition.x *= Math.sign(this._boxToApplyModify.worldMatrix.a);
    pivotPosition.y *= Math.sign(this._boxToApplyModify.worldMatrix.a);

    const rotated = Matrix3x3.rotate(this._getCurrentAngleToTransform()).applyToPoint(pivotPosition);

    const world = this._obbWorldCenter.add(rotated);

    this._worldPivot.copyFrom(world);
  }

  private _setTransformScale(currentPointer: Point, side: ResizeHandler): void {

    const worldMatrix = Matrix3x3.compose(
      Matrix3x3.translate(this._obbWorldCenter.x, this._obbWorldCenter.y),
      Matrix3x3.rotate(this._getCurrentAngleToTransform()),
    );

    const localMatrix = Matrix3x3.invert(worldMatrix) ?? Matrix3x3.identity();

    const localCursor = localMatrix
      .applyToPoint(currentPointer)
      .add(this._getPaddingToLocalCursor(side));

    const origVec = this._handlePosition.sub(this._pivotPosition);
    const cursorVec = localCursor.sub(this._pivotPosition);

    const scaleFactorX = this._computeDeadZoneAdjustedFactor(origVec, cursorVec, "x");
    const scaleFactorY = this._computeDeadZoneAdjustedFactor(origVec, cursorVec, "y");

    if (this._proportional === false) {
      this._transformScale.set(scaleFactorX, scaleFactorY);
      return
    }

    const isTakeEdge = this._pickedHandler!.length === 1
    const isTakeCorner = isTakeEdge === false

    if (isTakeEdge) {
      const isAxisX = this._pickedHandler!.split("").some((v) => ["e", "w"].includes(v))
      if (isAxisX) this._transformScale.set(scaleFactorX, scaleFactorX)

      const isAxisY = this._pickedHandler!.split("").some((v) => ["s", "n"].includes(v))
      if (isAxisY) this._transformScale.set(scaleFactorY, scaleFactorY)
    }

    if (isTakeCorner) {
      const commonScaleFactor = (scaleFactorX + scaleFactorY) / 2;
      this._transformScale.set(commonScaleFactor, commonScaleFactor);

      return
    }
  }

  private _setHandlePosition(side: ResizeHandler): void {
    const halfW = this._initialOBB.width / 2;
    const halfH = this._initialOBB.height / 2;

    let handleX = 0;
    let handleY = 0;

    switch (side) {
      case "nw":
        handleX = -halfW;
        handleY = -halfH;
        break;
      case "n":
        handleX = 0;
        handleY = -halfH;
        break;
      case "ne":
        handleX = halfW;
        handleY = -halfH;
        break;
      case "e":
        handleX = halfW;
        handleY = 0;
        break;
      case "se":
        handleX = halfW;
        handleY = halfH;
        break;
      case "s":
        handleX = 0;
        handleY = halfH;
        break;
      case "sw":
        handleX = -halfW;
        handleY = halfH;
        break;
      case "w":
        handleX = -halfW;
        handleY = 0;
        break;
    }

    handleX *= Math.sign(this._boxToApplyModify.worldMatrix.a);
    handleY *= Math.sign(this._boxToApplyModify.worldMatrix.a);

    this._handlePosition.set(handleX, handleY);
  }

  private _setPivotPosition(side: ResizeHandler): void {
    const halfW = this._initialOBB.width / 2;
    const halfH = this._initialOBB.height / 2;

    let pivotX = 0;
    let pivotY = 0;

    switch (side) {
      case "nw":
        pivotX = halfW;
        pivotY = halfH;
        break;
      case "n":
        pivotX = 0;
        pivotY = halfH;
        break;
      case "ne":
        pivotX = -halfW;
        pivotY = halfH;
        break;
      case "e":
        pivotX = -halfW;
        pivotY = 0;
        break;
      case "se":
        pivotX = -halfW;
        pivotY = -halfH;
        break;
      case "s":
        pivotX = 0;
        pivotY = -halfH;
        break;
      case "sw":
        pivotX = halfW;
        pivotY = -halfH;
        break;
      case "w":
        pivotX = halfW;
        pivotY = 0;
        break;
    }

    // pivotX = 0
    // pivotY = 0

    pivotX *= Math.sign(this._boxToApplyModify.worldMatrix.a);
    pivotY *= Math.sign(this._boxToApplyModify.worldMatrix.a);

    this._pivotPosition.set(pivotX, pivotY);
  }
}
