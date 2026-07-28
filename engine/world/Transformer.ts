import { isNil, mapKeys, size } from "lodash";
import type { EventObject } from "../behaviors/EventBehavior";
import { Group } from "../Group";
import { Matrix3x3, Point, type PointData, Polygon, Rectangle } from "../maths";
import { EllipseShape } from "../shapes/Ellipse";
import { PolygonShape } from "../shapes/Polygon";
import { Shape } from "../shapes/Shape";
import { getPointFromEvent, pointFromEvent } from "../shared/point";
import { SimObject } from "./sim-object";
import { drawOriginPoint } from "../behaviors/Transformable";

export type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
export type Edge = "top" | "right" | "bottom" | "left";

const r = 5
const r2 = 9

type TransformState = "idle" | "resize" | "rotate"

type ReiszeHandler = Corner | Edge


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

  private _transformState: TransformState = "resize"

  private readonly _transformHandlerShapes: Record<Edge | Corner, Shape> = {
    bottom: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
    right: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
    left: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
    top: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),

    "bottomRight": new EllipseShape(0, 0, r, r),
    "bottomLeft": new EllipseShape(0, 0, r, r),
    "topRight": new EllipseShape(0, 0, r, r),
    "topLeft": new EllipseShape(0, 0, r, r),
  };

  private readonly _rotateHandlerShapes: Record<Corner, Shape> = {
    "bottomRight": new EllipseShape(0, 0, r2, r2),
    "bottomLeft": new EllipseShape(0, 0, r2, r2),
    "topRight": new EllipseShape(0, 0, r2, r2),
    "topLeft": new EllipseShape(0, 0, r2, r2),
  }

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

  private _initialPointerAngle: number = 0

  private _registerTransformHandlerShapes() {
    const layer = this.layer();
    if (isNil(layer)) return;

    mapKeys(this._transformHandlerShapes, (shape, handler) => {
      shape.on("pointerdown", this._startResize.bind(this, handler as unknown as Corner | Edge))
      layer.add(shape);
    });

    mapKeys(this._rotateHandlerShapes, (shape, handler) => {
      shape.on("pointerdown", (event) => {
        this._transformState = "rotate"

        this._boxToApplyModify.beginInteraction("rotate");

        const mousePos = Point.fromData(getPointFromEvent(event.evt as PointerEvent))
        const originRotate = this._boxToApplyModify.getInWorldOriginPosition("rotate")

        const direction = mousePos.sub(originRotate)
        const currentAngle = Math.atan2(direction.y, direction.x)
        
        this._initialPointerAngle = currentAngle
      })

      layer.add(shape);
    });

    this.updateTransformHandlerShapes()
  }

  public constructor() {
    super();

    this.on("addToParent", () => {
      this._registerTransformHandlerShapes()
      // this._moveTransformHandlersToLayer()
      // this.updateTransformHandlerShapes()
    });

    window.addEventListener("pointermove", this._processResize.bind(this));
    window.addEventListener("pointerup", () => {
      this._finishResize()

      // this._moveTransformHandlersToLayer()
      this.updateTransformHandlerShapes()
    });

    window.addEventListener("pointermove", (event) => {
      if (this._transformState !== "rotate") return

      const originRotate = this._boxToApplyModify.getInWorldOriginPosition("rotate")
      const mousePos = Point.fromData(getPointFromEvent(event))

      const direction = mousePos.sub(originRotate)
      const currentAngle = Math.atan2(direction.y, direction.x)
      const targetRotation = (currentAngle - this._initialPointerAngle)

      this._boxToApplyModify.updateInteraction(targetRotation)

      this.updateTransformHandlerShapes()

    });

    window.addEventListener("pointerup", () => {
      if (this._transformState !== "rotate") return

      this._boxToApplyModify.endInteraction()
      this.updateTransformHandlerShapes()

      this._transformState = "idle"
      this._initialPointerAngle = 0

    });
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

  public updateTransformHandlerShapes() {
    const boundariesPositions = this._calculateTransformHandlerPositions(7);

    mapKeys(this._transformHandlerShapes, (shape, handler) => {
      if (EllipseShape.isEllipse(shape)) shape.position(boundariesPositions[handler as Corner])
      if (PolygonShape.isPolygon(shape)) shape.initialPoints = boundariesPositions[handler as Edge]
    })

    const rotateHandlerPositions = this._calculateTransformHandlerPositions(this._padding + r * 2);

    mapKeys(this._rotateHandlerShapes, (shape, handler) => {
      if (EllipseShape.isEllipse(shape)) {
        shape.position(rotateHandlerPositions[handler as Corner])
      }
    })
  }

  private _startResize(handler: Corner | Edge, event: EventObject) {
    this._transformState = "resize"
    this._pickedHandler = this._getEffectiveSide(handler) //this._getHandlerAfterTransforms(handler);

    this._setInitialState();
    this._setPivotPosition(this._pickedHandler);
    this._setHandlePosition(this._pickedHandler);
    this._setWorldPivot();

    this._boxToApplyModify.setOrigin("scale", this._getRelativeOriginScale(this._pickedHandler));
    this._boxToApplyModify.beginInteraction("scale");

    console.log(this._pickedHandler)


    const handlerCenter = this._transformHandlerShapes[handler].getBounds().center
    const currentPointer = Point.fromData(getPointFromEvent(event.evt as PointerEvent))

    // this._deltaBetweenCursorAndHandler = currentPointer.sub(handlerCenter)
  }

  private _processResize(event: PointerEvent) {
    if (isNil(this._pickedHandler)) return;

    this._proportional = event.shiftKey
    // this._boxToApplyModify.setOrigin("scale", this._getRelativeOriginScale(this._pickedHandler));

    const cursorPos = pointFromEvent(event)

    this._setTransformScale(cursorPos.sub(this._deltaBetweenCursorAndHandler), this._pickedHandler);
    this._boxToApplyModify.updateInteraction(this._transformScale);

    this.updateTransformHandlerShapes()
  }

  private _finishResize() {
    if (isNil(this._pickedHandler)) return;

    if (this._transformScale.x === 0) this._transformScale.x = 0.001
    if (this._transformScale.y === 0) this._transformScale.y = 0.001
    this._boxToApplyModify.updateInteraction(this._transformScale)

    this._boxToApplyModify.endInteraction();
    this.updateTransformHandlerShapes()

    this._transformScale.copyFrom(Point.one());
    this._deltaBetweenCursorAndHandler = Point.zero()
    this._pickedHandler = null;
  }

  private _calculateTransformHandlerPositions(padding: number) {
    const composed = Matrix3x3.compose(this.cachedMatrix, this.worldMatrix)

    const forAngle = ({
      rotate: composed,
      idle: this.worldMatrix,
      resize: this.worldMatrix,
    })[this._transformState];

    const currentAngle = Math.atan2(forAngle.b, forAngle.a)

    const originRotate = composed.applyToPoint(this.getOriginInOriginalSpace("rotate"))
    const unrotate = Matrix3x3.aroundOrigin(originRotate, () => Matrix3x3.rotate(-currentAngle))
    const rotate = Matrix3x3.aroundOrigin(originRotate, () => Matrix3x3.rotate(currentAngle))

    const matrix = Matrix3x3.compose(unrotate, composed)
    const bounds = this.getBounds({ skipTransform: true })
    const corners = bounds.getCorners()
    const points = corners.map(matrix.applyToPoint.bind(matrix))
    const scaledBounds = Polygon.getBounds(points).padding(padding)
    const nextCorners = scaledBounds.getCorners()
    const nextPoints = nextCorners.map(rotate.applyToPoint.bind(rotate))

    const mappedCorners = nextPoints

    return {
      bottom: [mappedCorners[2], mappedCorners[3]],
      right: [mappedCorners[1], mappedCorners[2]],
      left: [mappedCorners[3], mappedCorners[0]],
      top: [mappedCorners[0], mappedCorners[1]],

      "bottomRight": mappedCorners[2],
      "bottomLeft": mappedCorners[3],
      "topRight": mappedCorners[1],
      "topLeft": mappedCorners[0],
    } as Record<Edge, Array<Point>> & Record<Corner, Point>;
  }

  public render(context: CanvasRenderingContext2D): void {
    const cachedMatrix = this._boxToApplyModify.cachedMatrix

    context.save();
    cachedMatrix.applyToContext(context);
    super.render(context);
    context.restore();

    {
      drawOriginPoint(context, this._handlePosition, "_handlePosition")
      drawOriginPoint(context, this._pivotPosition, "_pivotPosition")
      drawOriginPoint(context, this._obbWorldCenter, "_obbWorldCenter")
      drawOriginPoint(context, this._worldPivot, "_worldPivot")
      drawOriginPoint(context, this.getInLocalOriginPosition("scale"), "originScale")
    }

    this.children().map((child) => {
      const bounds = child.getBounds({ skipTransform: true });
      const matrix = Matrix3x3.compose(this.cachedMatrix, child.worldMatrix);

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

  private _setWorldPivot(): void {
    const pivotPosition = this._pivotPosition.clone();

    // pivotPosition.x *= Math.sign(this.worldMatrix.a)
    // pivotPosition.y *= Math.sign(this.worldMatrix.d)

    const rotated = Matrix3x3
      .rotate(this.getCurrentAngle())
      .applyToPoint(pivotPosition);

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

  private _getEffectiveSide(side: ReiszeHandler): ReiszeHandler {
    const positions = this._calculateTransformHandlerPositions(0)

    const topCenterY = positions.topLeft.add(positions.topRight).scale(0.5).y
    const bottomCenterY = positions.bottomLeft.add(positions.bottomRight).scale(0.5).y

    const leftCenterX = positions.topLeft.add(positions.bottomLeft).scale(0.5).x
    const rightCenterX = positions.topRight.add(positions.bottomRight).scale(0.5).x

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

  private _setTransformScale(currentPointer: Point, side: Edge | Corner): void {
    const worldMatrix = Matrix3x3.compose(
      Matrix3x3.translate(this._obbWorldCenter.x, this._obbWorldCenter.y),
      Matrix3x3.rotate(this.getCurrentAngle()),
    );

    // const worldMatrix = this.worldMatrix

    const localMatrix = Matrix3x3.invert(worldMatrix) ?? Matrix3x3.identity();

    const localCursor = localMatrix
      .applyToPoint(currentPointer)
      .add(this._getPaddingToLocalCursor(side));

    const origVec = this._handlePosition.sub(this._pivotPosition);
    const cursorVec = localCursor.sub(this._pivotPosition);

    const scaleFactorX = this._computeDeadZoneAdjustedFactor(origVec, cursorVec, "x");
    const scaleFactorY = this._computeDeadZoneAdjustedFactor(origVec, cursorVec, "y");

    this._transformScale.set(scaleFactorX, scaleFactorY);

    /**
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
    */
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

    handleX *= Math.sign(this.worldMatrix.a)
    handleY *= Math.sign(this.worldMatrix.a)

    this._handlePosition.set(handleX, handleY);
  }

  private _setPivotPosition(side: Edge | Corner): void {
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

    pivotX *= Math.sign(this.worldMatrix.a)
    pivotY *= Math.sign(this.worldMatrix.a)

    // pivotX = 0
    // pivotY = 0

    this._pivotPosition.set(pivotX, pivotY);
  }
}
