import { isNil } from "lodash";
import type { EventObject } from "../../behaviors/EventBehavior";
import { Layer } from "../../Layer";
import { Matrix3x3, Point, type PointData, Rectangle } from "../../maths";
import { EllipseShape } from "../../shapes/Ellipse";
import { PolygonShape } from "../../shapes/Polygon";
import { Shape } from "../../shapes/Shape";
import { pointFromEvent } from "../../shared/point";
import { mapKeys } from "../../utils";
import { BaseTransformOperation } from "./base-transform-operation";
import type { Corner, Edge, TransformOperationModel } from "./transform-operation.interface";

type ResizeHandler = Corner | Edge

const r = 5

export class ResizeTransformOpearation extends BaseTransformOperation implements TransformOperationModel {
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

  private readonly _transformHandlerShapes: Record<ResizeHandler, Shape> = {
    bottom: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
    right: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
    left: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
    top: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),

    bottomRight: new EllipseShape(0, 0, r, r),
    bottomLeft: new EllipseShape(0, 0, r, r),
    topRight: new EllipseShape(0, 0, r, r),
    topLeft: new EllipseShape(0, 0, r, r),
  };

  public addHandlersToLayer(layer: Layer) {
    mapKeys(this._transformHandlerShapes, (handler, shape) => {
      shape.on("pointerdown", this.startTransform.bind(this))
      shape.addClassname(handler)
      layer.add(shape);
    });

    this.updateHandlersPosition()
  }

  public updateHandlersPosition() {
    const nextPositions = this.computeTransformHandlerPositions(7);

    // console.log(JSON.stringify(nextPositions.corner, null, 2))
    mapKeys(this._transformHandlerShapes, (handler, shape) => {
      if (EllipseShape.isEllipse(shape)) shape.position(nextPositions.corner[handler as Corner])

      if (PolygonShape.isPolygon(shape)) {
        shape.initialPoints = nextPositions.edge[handler as Edge] as unknown as Array<PointData>
      }
    })
  }

  public startTransform(event: EventObject) {
    this.box.transformState = "resize"

    const handler = event.target.classList[0] as ResizeHandler
    this._pickedHandler = this._getEffectiveSide(handler)

    this._setInitialState();
    this._setPivotPosition(this._pickedHandler);
    this._setHandlePosition(this._pickedHandler);
    this._setWorldPivot();

    this.box.setOrigin("scale", this._getRelativeOriginScale(this._pickedHandler));
    this.box.beginInteraction("scale");

    const handlerCenter = this._transformHandlerShapes[handler].getBounds().center
    const currentPointer = pointFromEvent(event.evt as PointerEvent)

    this._deltaBetweenCursorAndHandler = currentPointer.sub(handlerCenter)
  }

  public processTransform(event: PointerEvent) {
    if (isNil(this._pickedHandler)) return;

    this._proportional = event.shiftKey
    this.box.setOrigin("scale", this._getRelativeOriginScale(this._pickedHandler));

    const cursorPos = pointFromEvent(event)

    this._setTransformScale(cursorPos.sub(this._deltaBetweenCursorAndHandler), this._pickedHandler);
    this.box.updateInteraction(this._transformScale);

    this.box.updateHandlersPosition()
  }

  public finishTransform() {
    if (isNil(this._pickedHandler)) return;

    if (this._transformScale.x === 0) this._transformScale.x = 0.001
    if (this._transformScale.y === 0) this._transformScale.y = 0.001

    this.box.updateInteraction(this._transformScale)
    this.box.endInteraction();

    this.box.updateHandlersPosition()

    this._transformScale.copyFrom(Point.one());
    this._deltaBetweenCursorAndHandler = Point.zero()
    this._pickedHandler = null;
    this.box.transformState = "idle"
  }

  private _setInitialState(): void {
    const bounds = this.box.getUnrotateBounds()

    this._initialOBB.copyFrom(bounds);
    this._obbWorldCenter.copyFrom(this._initialOBB.center);
  }

  private _setWorldPivot(): void {
    const pivotPosition = this._pivotPosition.clone();

    const rotated = Matrix3x3.rotate(this.box.getCurrentAngle()).applyToPoint(pivotPosition);
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
      Matrix3x3.rotate(this.box.getCurrentAngle()),
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
    const positions = this.computeTransformHandlerPositions(0)

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

    const matrix = this.box.worldMatrix;

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

    point.x *= Math.sign(this.box.worldMatrix.a);
    point.y *= Math.sign(this.box.worldMatrix.a);

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

    handleX *= Math.sign(this.box.worldMatrix.a)
    handleY *= Math.sign(this.box.worldMatrix.a)

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

    pivotX *= Math.sign(this.box.worldMatrix.a)
    pivotY *= Math.sign(this.box.worldMatrix.a)

    // pivotX = 0
    // pivotY = 0

    this._pivotPosition.set(pivotX, pivotY);
  }
}