import { isNil } from "lodash";
import type { EventObject } from "../../behaviors/EventBehavior";
import { Matrix3x3, Point, type PointData, Rectangle } from "../../maths";
import { pointFromEvent } from "../../shared/point";
import { SimObject } from "../sim-object";
import { TransformerV2 } from "../TransformerV2";
import type { Corner, Edge } from "./transform-operation.interface";
import { drawOriginPoint } from "../../behaviors/Transformable";
import { Shape } from "../../shapes/Shape";

type ResizeHandler = Corner | Edge

const r = 5

export class ResizeTransformOpearation {
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

  public constructor(public context: TransformerV2, public node: SimObject) { }

  public drawDebug(context: CanvasRenderingContext2D) {
    context.save()

    const originScale = this.node.getInWorldOriginPosition("scale")

    drawOriginPoint(context, this._obbWorldCenter, "_obbWorldCenter")
    drawOriginPoint(context, this._handlePosition, "_handlePosition")
    drawOriginPoint(context, this._pivotPosition, "_pivotPosition")
    drawOriginPoint(context, this._worldPivot, "_worldPivot")
    drawOriginPoint(context, originScale, "originScale")

    context.restore()
  }

  public startTransform(event: EventObject) {
    this.context.transformState = "resize"

    const handler = event.target.classList[0] as ResizeHandler
    this._pickedHandler = this._getEffectiveSide(handler)

    this._setInitialState();
    this._setPivotPosition(this._pickedHandler);
    this._setHandlePosition(this._pickedHandler);
    this._setWorldPivot();

    this.node.setOrigin("scale", this._getRelativeOriginScale(this._pickedHandler));
    this.node.beginInteraction("scale");

    const mergedResizeHandlers = Object
      .keys(this.context.resizeHandlerShapes)
      .reduce((acc, key) => {
        return Object.assign(
          acc, 
          this.context.resizeHandlerShapes[key as keyof typeof this.context.resizeHandlerShapes]
        )
      }, {} as Record<ResizeHandler, Shape>)

    const handlerCenter = mergedResizeHandlers[handler].getBounds().center
    const currentPointer = pointFromEvent(event.evt as PointerEvent)

    this._deltaBetweenCursorAndHandler = currentPointer.sub(handlerCenter)
  }

  public processTransform(event: PointerEvent) {
    if (isNil(this._pickedHandler)) return;

    this._proportional = event.shiftKey
    this.node.setOrigin("scale", this._getRelativeOriginScale(this._pickedHandler));

    const cursorPos = pointFromEvent(event)

    this._setTransformScale(cursorPos.sub(this._deltaBetweenCursorAndHandler), this._pickedHandler);
    this.node.updateInteraction(this._transformScale);

    this.context.updateHandlersPosition()
  }

  public finishTransform() {
    if (isNil(this._pickedHandler)) return;

    if (this._transformScale.x === 0) this._transformScale.x = 0.001
    if (this._transformScale.y === 0) this._transformScale.y = 0.001

    this.node.updateInteraction(this._transformScale)
    this.node.endInteraction();

    this.context.updateHandlersPosition()

    this._transformScale.copyFrom(Point.one());
    this._deltaBetweenCursorAndHandler = Point.zero()
    this._pickedHandler = null;

    this.context.transformState = "idle"
  }

  private _setInitialState(): void {
    const bounds = this.node.getUnrotateBounds()

    this._initialOBB.copyFrom(bounds);
    this._obbWorldCenter.copyFrom(this._initialOBB.center);
  }

  private _setWorldPivot(): void {
    const pivotPosition = this._pivotPosition.clone();
    const currentAngle = this.node.getCurrentAngle()

    const rotated = Matrix3x3.rotate(currentAngle).applyToPoint(pivotPosition);
    const world = this._obbWorldCenter.add(rotated);

    this._worldPivot.copyFrom(world);
  }

  private _computeDeadZoneAdjustedFactor(referenceScale: Point, pointerOffset: Point, axis: keyof PointData): number {
    const deadZoneThreshold: number = this._padding * 2;

    if (referenceScale[axis] !== 0) {
      const initialRatio = pointerOffset[axis] / referenceScale[axis];
      if (initialRatio > 0) return Math.max(0.01, initialRatio);
      else if (Math.abs(pointerOffset[axis]) <= deadZoneThreshold) return 0
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
      Matrix3x3.rotate(this.node.getCurrentAngle()),
    );

    const localMatrix = Matrix3x3.invert(worldMatrix) ?? Matrix3x3.identity();
    const localCursor = localMatrix.applyToPoint(currentPointer).add(this._getPaddingToLocalCursor(side));

    const origVec = this._handlePosition.sub(this._pivotPosition);
    const cursorVec = localCursor.sub(this._pivotPosition);

    const scaleFactorX = this._computeDeadZoneAdjustedFactor(origVec, cursorVec, "x");
    const scaleFactorY = this._computeDeadZoneAdjustedFactor(origVec, cursorVec, "y");

    this._transformScale.set(scaleFactorX, scaleFactorY);
  }

  private _getEffectiveSide(side: ResizeHandler): ResizeHandler {
    const positions = this.context.computeTransformHandlerPositions(0)

    const { bottomRight, bottomLeft, topRight, topLeft } = positions.corner

    const topCenterY = topLeft.add(topRight).scale(0.5).y
    const bottomCenterY = bottomLeft.add(bottomRight).scale(0.5).y

    const leftCenterX = topLeft.add(bottomLeft).scale(0.5).x
    const rightCenterX = topRight.add(bottomRight).scale(0.5).x

    const isFlippedY = topCenterY > bottomCenterY
    const isFlippedX = leftCenterX > rightCenterX

    let effective = side

    if (isFlippedY) {
      switch (effective) {
        case "top": effective = "bottom"; break
        case "bottom": effective = "top"; break
        case "topLeft": effective = "bottomLeft"; break
        case "topRight": effective = "bottomRight"; break
        case "bottomLeft": effective = "topLeft"; break
        case "bottomRight": effective = "topRight"; break
      }
    }

    if (isFlippedX) {
      switch (effective) {
        case "right": effective = "left"; break
        case "left": effective = "right"; break
        case "topLeft": effective = "topRight"; break
        case "topRight": effective = "topLeft"; break
        case "bottomLeft": effective = "bottomRight"; break
        case "bottomRight": effective = "bottomLeft"; break
      }
    }

    return effective
  }

  private _getRelativeOriginScale(side: ResizeHandler) {
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
      case "topLeft":
        relativeOrigin.set(1, 1);
        break;
      case "topRight":
        relativeOrigin.set(0, 1);
        break;
      case "bottomRight":
        relativeOrigin.set(0, 0)
        break;
      case "bottomLeft":
        relativeOrigin.set(1, 0);
        break;
    }

    const matrix = this.node.worldMatrix;

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
      case "topLeft":
        point = new Point(padding, padding);
        break;
      case "top":
        point = new Point(padding, padding);
        break;
      case "topRight":
        point = new Point(-padding, padding);
        break;
      case "right":
        point = new Point(-padding, padding);
        break;
      case "bottomRight":
        point = new Point(-padding, -padding);
        break;
      case "bottom":
        point = new Point(padding, -padding);
        break;
      case "bottomLeft":
        point = new Point(padding, -padding);
        break;
      case "left":
        point = new Point(padding, -padding);
        break;
    }

    point.x *= Math.sign(this.node.worldMatrix.a);
    point.y *= Math.sign(this.node.worldMatrix.a);

    return point;
  }

  private _setHandlePosition(side: ResizeHandler): void {
    const halfW = this._initialOBB.width / 2;
    const halfH = this._initialOBB.height / 2;

    let handleX = 0;
    let handleY = 0;

    switch (side) {
      case "topLeft":
        handleX = -halfW;
        handleY = -halfH;
        break;
      case "top":
        handleX = 0;
        handleY = -halfH;
        break;
      case "topRight":
        handleX = halfW;
        handleY = -halfH;
        break;
      case "right":
        handleX = halfW;
        handleY = 0;
        break;
      case "bottomRight":
        handleX = halfW;
        handleY = halfH;
        break;
      case "bottom":
        handleX = 0;
        handleY = halfH;
        break;
      case "bottomLeft":
        handleX = -halfW;
        handleY = halfH;
        break;
      case "left":
        handleX = -halfW;
        handleY = 0;
        break;
    }

    handleX *= Math.sign(this.node.worldMatrix.a)
    handleY *= Math.sign(this.node.worldMatrix.a)

    this._handlePosition.set(handleX, handleY);
  }

  private _setPivotPosition(side: ResizeHandler): void {
    const halfW = this._initialOBB.width / 2;
    const halfH = this._initialOBB.height / 2;

    let pivotX = 0;
    let pivotY = 0;

    switch (side) {
      case "topLeft":
        pivotX = halfW;
        pivotY = halfH;
        break;
      case "top":
        pivotX = 0;
        pivotY = halfH;
        break;
      case "topRight":
        pivotX = -halfW;
        pivotY = halfH;
        break;
      case "right":
        pivotX = -halfW;
        pivotY = 0;
        break;
      case "bottomRight":
        pivotX = -halfW;
        pivotY = -halfH;
        break;
      case "bottom":
        pivotX = 0;
        pivotY = -halfH;
        break;
      case "bottomLeft":
        pivotX = halfW;
        pivotY = -halfH;
        break;
      case "left":
        pivotX = halfW;
        pivotY = 0;
        break;
    }

    pivotX *= Math.sign(this.node.worldMatrix.a)
    pivotY *= Math.sign(this.node.worldMatrix.a)

    // pivotX = 0
    // pivotY = 0

    this._pivotPosition.set(pivotX, pivotY);
  }
}