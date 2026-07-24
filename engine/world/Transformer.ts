import {isNil, mapKeys} from "lodash";
import {Group} from "../Group";
import {Matrix3x3, Point, type PointData, Rectangle} from "../maths";
import {EllipseShape} from "../shapes/Ellipse";
import {PolygonShape} from "../shapes/Polygon";
import {Shape} from "../shapes/Shape";
import {getPointFromEvent, pointFromEvent} from "../shared/point";
import {SimObject} from "./sim-object";
import type {EventObject} from "../behaviors/EventBehavior";

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type Edge = "top" | "right" | "bottom" | "left";

const r = 7

export class Transformer extends Group {
  public static isTransformer(candidate: unknown): candidate is Transformer {
    return candidate instanceof Transformer
  }

  private readonly _initialOBB = new Rectangle();
  private readonly _obbWorldCenter = new Point();
  private readonly _handlePosition = new Point();
  private readonly _transformScale = new Point(1, 1);
  private readonly _pivotPosition = new Point();
  private readonly _worldPivot = new Point();

  private _deltaBetweenCursorAndHandler: Point = new Point()
  
  private _pickedHandler: Corner | Edge | null = null;
  private _proportional: boolean = false
  private _padding = 7;

  private readonly _transformHandlerShapes: Record<Edge | Corner, Shape> = {
    bottom: new PolygonShape({initialPoints: [{x: 0, y: 0}, {x: 0, y: 0}]}),
    right: new PolygonShape({initialPoints: [{x: 0, y: 0}, {x: 0, y: 0}]}),
    left: new PolygonShape({initialPoints: [{x: 0, y: 0}, {x: 0, y: 0}]}),
    top: new PolygonShape({initialPoints: [{x: 0, y: 0}, {x: 0, y: 0}]}),

    "bottom-right": new EllipseShape(0, 0, r, r),
    "bottom-left": new EllipseShape(0, 0, r, r),
    "top-right": new EllipseShape(0, 0, r, r),
    "top-left": new EllipseShape(0, 0, r, r),
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

  private _getHandlerAfterTransforms(handler: string): Edge | Corner {
    const isFlippedX = this._boxToApplyModify.worldMatrix.a < 0;
    const isFlippedY = this._boxToApplyModify.worldMatrix.d < 0;

    return {
      bottom: isFlippedY ? "top" : "bottom",
      right: isFlippedX ? "left" : "right",
      left: isFlippedX ? "right" : "left",
      top: isFlippedY ? "bottom" : "top",

      "bottom-right": [isFlippedY ? "top" : "bottom", isFlippedX ? "left" : "right"].join("-"),
      "bottom-left": [isFlippedY ? "top" : "bottom", isFlippedX ? "right" : "left"].join("-"),
      "top-right": [isFlippedY ? "bottom" : "top", isFlippedX ? "left" : "right"].join("-"),
      "top-left": [isFlippedY ? "bottom" : "top", isFlippedX ? "right" : "left"].join("-"),
    }[handler] as Edge | Corner;
  }

  public updateTransformHandlerShapes() {
    const boundariesPositions = this._calculateTransformHandlerPositions();

    mapKeys(this._transformHandlerShapes, (shape, handler) => {
      if (EllipseShape.isEllipse(shape)) shape.position(boundariesPositions[handler as Corner])
      if (PolygonShape.isPolygon(shape)) shape.initialPoints = boundariesPositions[handler as Edge]
    })
  }

  private _registerTransformHandlerShapes() {
    const layer = this.layer();
    if (isNil(layer)) return;

    mapKeys(this._transformHandlerShapes, (shape, handler) => {
      shape.on("pointerdown", this._startResize.bind(this, handler as unknown as Corner | Edge))
      layer.add(shape);
    });

    this.updateTransformHandlerShapes()
  }
  
  private _startResize(handler: Corner | Edge, event: EventObject) {
    this._pickedHandler = this._getHandlerAfterTransforms(handler);

    this._setInitialState();
    this._setPivotPosition(this._pickedHandler);
    this._setHandlePosition(this._pickedHandler);
    this._setWorldPivot();

    this._boxToApplyModify.setOrigin("scale", this._getRelativeOriginScale(this._pickedHandler));
    this._boxToApplyModify.beginInteraction("scale");

    const handlerCenter = this._transformHandlerShapes[handler].getBounds().center
    const currentPointer = Point.fromData(getPointFromEvent(event.evt as PointerEvent))

    this._deltaBetweenCursorAndHandler = currentPointer.sub(handlerCenter)
  }

  private _processResize(event: PointerEvent) {
    if (isNil(this._pickedHandler)) return;

    this._proportional = event.shiftKey
    this._boxToApplyModify.setOrigin("scale", this._getRelativeOriginScale(this._pickedHandler));

    const cursorPos = pointFromEvent(event)

    this._setTransformScale(cursorPos.sub(this._deltaBetweenCursorAndHandler), this._pickedHandler);
    this._boxToApplyModify.updateInteraction(this._transformScale);

    this.updateTransformHandlerShapes()
  }

  private _finishResize() {
    this._boxToApplyModify.endInteraction();
    this.updateTransformHandlerShapes()

    this._transformScale.copyFrom(Point.one());
    this._deltaBetweenCursorAndHandler = Point.zero()
    this._pickedHandler = null;
  }

  private _calculateTransformHandlerPositions() {
    const matrix = this._boxToApplyModify.isInteracting
      ? Matrix3x3.compose(this._boxToApplyModify.cachedMatrix, this._boxToApplyModify.localMatrix)
      : this._boxToApplyModify.worldMatrix

    const bounds = this._boxToApplyModify.getBounds({skipTransform: true});
    const angle = Math.atan2(Math.abs(matrix.b), Math.abs(matrix.a))

    const corners = bounds.getCorners().map((point) => matrix.applyToPoint(point));

    const rotated = Matrix3x3.rotate(angle);

    const padding = [
      {x: -this._padding, y: -this._padding},
      {x: this._padding, y: -this._padding},
      {x: this._padding, y: this._padding},
      {x: -this._padding, y: this._padding},
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
    } as Record<Edge, Array<Point>> & Record<Corner, Point>;
  }

  public render(context: CanvasRenderingContext2D): void {
    const cachedMatrix = this._boxToApplyModify.cachedMatrix

    context.save();
    cachedMatrix.applyToContext(context);
    super.render(context);
    context.restore();

    this.children().map((child) => {
      const bounds = child.getBounds({skipTransform: true});
      const matrix = Matrix3x3.compose(cachedMatrix, child.worldMatrix);

      const corners = bounds.getCorners().map(matrix.applyToPoint.bind(matrix));

      context.beginPath();
      PolygonShape.tracePath({ pointsToTrace: corners, closed: false, tension: 0, context })
      context.closePath();
      context.stroke();
      context.restore();
    });
  }

  private _setInitialState(): void {
    const bounds = this._boxToApplyModify.getUnrotateBounds()

    this._initialOBB.copyFrom(bounds);
    this._obbWorldCenter.copyFrom(this._initialOBB.center);
  }

  private _getCurrentAngleToTransform(): number {
    const cachedMatrix = this._boxToApplyModify.worldMatrix;
    return Math.atan2(cachedMatrix.b, cachedMatrix.a);
  }

  private _setWorldPivot(): void {
    const pivotPosition = this._pivotPosition.clone();

    pivotPosition.x *= Math.sign(this._boxToApplyModify.worldMatrix.a);
    pivotPosition.y *= Math.sign(this._boxToApplyModify.worldMatrix.a);

    const rotated = Matrix3x3.rotate(this._getCurrentAngleToTransform()).applyToPoint(pivotPosition);

    const world = this._obbWorldCenter.add(rotated);

    this._worldPivot.copyFrom(world);
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

  private _setTransformScale(currentPointer: Point, side: Edge | Corner): void {
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

    const isTakeEdge = this._pickedHandler!.split("-").length === 1
    const isTakeCorner = isTakeEdge === false

    if (isTakeEdge) {
      const isAxisX = this._pickedHandler!
        .split("-")
        .some((v) => ["left", "right"]
        .includes(v))
      
      if (isAxisX) this._transformScale.set(scaleFactorX, scaleFactorX)

      const isAxisY = this._pickedHandler!
        .split("-")
        .some((v) => ["top", "bottom"]
        .includes(v))
      
      if (isAxisY) this._transformScale.set(scaleFactorY, scaleFactorY)
    }

    if (isTakeCorner) {
      const commonScaleFactor = (scaleFactorX + scaleFactorY) / 2;
      this._transformScale.set(commonScaleFactor, commonScaleFactor);

      return
    }
  }

  private _getRelativeOriginScale(side: Corner | Edge) {
    const relativeOrigin = new Point();

    switch (side) {
      case "top":
        if (this._proportional) relativeOrigin.set(0.5, 1);
        else relativeOrigin.set(0, 1);
        break;
      case "right":
        if (this._proportional) relativeOrigin.set(0, 0.5);
        else relativeOrigin.set(0, 0);
        // relativeOrigin.set(0.5, 0.5)
        break;
      case "bottom":
        if (this._proportional) relativeOrigin.set(0.5, 0);
        else relativeOrigin.set(1, 0);
        break;
      case "left":
        if (this._proportional) relativeOrigin.set(1, 0.5);
        else relativeOrigin.set(1, 0);
        break;
      case "top-left":
        relativeOrigin.set(1, 1);
        break;
      case "top-right":
        relativeOrigin.set(0, 1);
        break;
      case "bottom-right":
        relativeOrigin.set(0, 0)
        break;
      case "bottom-left":
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

  private _getPaddingToLocalCursor(side: Corner | Edge) {
    const padding = this._padding;

    let point: Point;

    switch (side) {
      case "top-left":
        point = new Point(padding, padding);
        break;
      case "top":
        point = new Point(padding, padding);
        break;
      case "top-right":
        point = new Point(-padding, padding);
        break;
      case "right":
        point = new Point(-padding, padding);
        break;
      case "bottom-right":
        point = new Point(-padding, -padding);
        break;
      case "bottom":
        point = new Point(padding, -padding);
        break;
      case "bottom-left":
        point = new Point(padding, -padding);
        break;
      case "left":
        point = new Point(padding, -padding);
        break;
    }

    point.x *= Math.sign(this._boxToApplyModify.worldMatrix.a);
    point.y *= Math.sign(this._boxToApplyModify.worldMatrix.a);

    return point;
  }

  private _setHandlePosition(side: Edge | Corner): void {
    const halfW = this._initialOBB.width / 2;
    const halfH = this._initialOBB.height / 2;

    let handleX = 0;
    let handleY = 0;

    switch (side) {
      case "top-left":
        handleX = -halfW;
        handleY = -halfH;
        break;
      case "top":
        handleX = 0;
        handleY = -halfH;
        break;
      case "top-right":
        handleX = halfW;
        handleY = -halfH;
        break;
      case "right":
        handleX = halfW;
        handleY = 0;
        break;
      case "bottom-right":
        handleX = halfW;
        handleY = halfH;
        break;
      case "bottom":
        handleX = 0;
        handleY = halfH;
        break;
      case "bottom-left":
        handleX = -halfW;
        handleY = halfH;
        break;
      case "left":
        handleX = -halfW;
        handleY = 0;
        break;
    }

    handleX *= Math.sign(this._boxToApplyModify.worldMatrix.a);
    handleY *= Math.sign(this._boxToApplyModify.worldMatrix.a);

    this._handlePosition.set(handleX, handleY);
  }

  private _setPivotPosition(side: Edge | Corner): void {
    const halfW = this._initialOBB.width / 2;
    const halfH = this._initialOBB.height / 2;

    let pivotX = 0;
    let pivotY = 0;

    switch (side) {
      case "top-left":
        pivotX = halfW;
        pivotY = halfH;
        break;
      case "top":
        pivotX = 0;
        pivotY = halfH;
        break;
      case "top-right":
        pivotX = -halfW;
        pivotY = halfH;
        break;
      case "right":
        pivotX = -halfW;
        pivotY = 0;
        break;
      case "bottom-right":
        pivotX = -halfW;
        pivotY = -halfH;
        break;
      case "bottom":
        pivotX = 0;
        pivotY = -halfH;
        break;
      case "bottom-left":
        pivotX = halfW;
        pivotY = -halfH;
        break;
      case "left":
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
