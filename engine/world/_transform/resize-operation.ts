import type {EventObject} from "../../behaviors/EventBehavior";
import {EPSILON, inverseOrIdentity, type TransformOperation} from "../../behaviors/NodeTransformer";
import {Matrix3x3, Point, type PointData, Rectangle} from "../../maths";
import {ResizeTransformer} from "../TransformerV2";
import type {Corner, Edge} from "./transform-operation.interface";
import {Shape} from "../../core/Shape";
import {drawOriginPoint} from "../../behaviors/draw-point";

type ResizeHandler = Corner | Edge;

export type ResizeOperationContext = {
  setOrigin: (type: TransformOperation, relativePosition: PointData) => void
  beginInteraction: (type: TransformOperation) => void
  updateInteraction: (value: PointData) => void
  endInteraction: () => void

  getWorldPointer: () => Point
  getWorldMatrix: () => Matrix3x3
  getBounds: () => Rectangle

  handlersMap: Record<ResizeHandler, Shape>
}

export class ResizeTransformOperation {
  private readonly _initialBounds = new Rectangle();
  private readonly _startWorldMatrix = Matrix3x3.identity();
  private readonly _inverseStartWorldMatrix = Matrix3x3.identity();

  private readonly _handleLocal = new Point();
  private readonly _pivotLocal = new Point();

  private readonly _markerToHandleLocal = new Point();
  private readonly _pointerToMarkerWorld = new Point();

  private readonly _transformScale = new Point(1, 1);

  private _pickedHandler: ResizeHandler | null = null;
  private _proportional = false;
  private _activeX = false;
  private _activeY = false;
  private _started = false;

  private context!: ResizeOperationContext
  
  debugRender(context: CanvasRenderingContext2D) {
    drawOriginPoint(context, this._startWorldMatrix.applyToPoint(this._pivotLocal), "_pivotLocal")
    drawOriginPoint(context, this._startWorldMatrix.applyToPoint(this._handleLocal), "_handleLocal")
  }

  public initialize(context: ResizeOperationContext): void {
    this.context = context
  }

  public startTransform(event: EventObject<PointerEvent>): void {
    this._setInitialState(event)

    const localMarker = this._getLocalMarker()

    this._setActiveAxis()
    this._setHandleLocal(localMarker)
    this._setPivotLocal()
    this._setMarkerPosition(localMarker)
    this._setScaleOrigin();

    this.context.beginInteraction("scale");

    this._transformScale.set(1, 1);
    this._started = true;
  }

  public processTransform(event: EventObject<PointerEvent>): void {
    if (!this._started || !this._pickedHandler) return;

    this._proportional = event.evt.shiftKey;

    this._setTransformScale()
    this._setScaleOrigin();

    this.context.updateInteraction(this._transformScale);
    // this.context.updateHandlersPosition();
  }

  public finishTransform(_event: EventObject<PointerEvent>): void {
    if (!this._started) return;

    if (this._transformScale.x === 0) this._transformScale.x = 0.001;
    if (this._transformScale.y === 0) this._transformScale.y = 0.001;

    this.context.updateInteraction(this._transformScale);
    this.context.endInteraction();

    // this.context.updateHandlersPosition();

    this._started = false;
    this._activeX = false;
    this._activeY = false;
    this._pickedHandler = null;
    this._proportional = false;

    this._transformScale.set(1, 1);

    this._pointerToMarkerWorld.set(0, 0);
    this._markerToHandleLocal.set(0, 0);
  }

  private _setScaleOrigin(): void {
    const bounds = this._initialBounds;

    const delta = this._pivotLocal.sub(bounds)

    const rx = bounds.width > EPSILON ? delta.x / bounds.width : 0.5;
    const ry = bounds.height > EPSILON ? delta.y / bounds.height : 0.5;

    this.context.setOrigin("scale", {
      x: rx,
      y: ry,
    });
  }

  private _setTransformScale() {
    const markerWorld = this.context.getWorldPointer().sub(this._pointerToMarkerWorld);
    const markerLocal = this._inverseStartWorldMatrix.applyToPoint(markerWorld);

    const cursorLocal = markerLocal.add(this._getPaddingToLocalCursor(this._pickedHandler!));

    const start = this._handleLocal.sub(this._pivotLocal)
    const current = cursorLocal.sub(this._pivotLocal)

    let sx = this._activeX ? this._computeDeadZoneAdjustedFactor(start, current, "x") : 1
    let sy = this._activeY ? this._computeDeadZoneAdjustedFactor(start, current, "y") : 1

    if (this._proportional) {
      let uniform: number;

      if (this._activeX && this._activeY) {
        const denominator = start.lengthSquared()
        const projected = denominator > EPSILON ? start.lengthSquared(current) / denominator : 1;

        const startLen = start.length()
        const currentAlong = projected * startLen;

        uniform = startLen > EPSILON
          ? this._computeDeadZoneAdjustedFactor(new Point(startLen, 0), new Point(currentAlong, 0), "x")
          : 1;

      } else {
        uniform = this._activeX ? sx : sy;
      }

      sx = uniform;
      sy = uniform;
    }

    this._transformScale.set(sx, sy);
  }

  private _computeDeadZoneAdjustedFactor(referenceScale: Point, pointerOffset: Point, axis: keyof PointData): number {
    const padding = ResizeTransformer.OFFSET_BETWEEN_SHAPES_AND_AABB;
    const measuredPadding = Math.abs(this._markerToHandleLocal[axis]);

    const deadZoneThreshold = (measuredPadding > EPSILON ? measuredPadding : padding) * 2;

    if (referenceScale[axis] === 0) return 1;

    const initialRatio = pointerOffset[axis] / referenceScale[axis];
    if (initialRatio > 0) return Math.max(0.01, initialRatio);

    if (Math.abs(pointerOffset[axis]) <= deadZoneThreshold) return 0;

    const deadZoneAdjustedValue = pointerOffset[axis] + Math.sign(referenceScale[axis]) * deadZoneThreshold;
    const adjustedRatio = deadZoneAdjustedValue / referenceScale[axis];

    return Math.sign(adjustedRatio) * Math.max(0.01, Math.abs(adjustedRatio));
  }

  private _getPaddingToLocalCursor(side: ResizeHandler): Point {
    const measured = new Point(
      -this._markerToHandleLocal.x,
      -this._markerToHandleLocal.y,
    );

    if (Math.hypot(measured.x, measured.y) > EPSILON) return measured;

    const padding = ResizeTransformer.OFFSET_BETWEEN_SHAPES_AND_AABB;
    const point = new Point();

    switch (side) {
      case "topLeft":
        point.set(padding, padding);
        break;
      case "top":
        point.set(padding, padding);
        break;
      case "topRight":
        point.set(-padding, padding);
        break;
      case "right":
        point.set(-padding, padding);
        break;
      case "bottomRight":
        point.set(-padding, -padding);
        break;
      case "bottom":
        point.set(padding, -padding);
        break;
      case "bottomLeft":
        point.set(padding, -padding);
        break;
      case "left":
        point.set(padding, -padding);
        break;
    }

    return point;
  }

  private _setInitialState(event: EventObject<PointerEvent>) {
    const handler = event.target.getDataAttr("handler") as ResizeHandler | undefined;
    if (!handler) return;

    const startWorld = this.context.getWorldMatrix();
    const inverse = inverseOrIdentity(startWorld);

    // { skipTransform: true }
    const bounds = this.context.getBounds();

    this._initialBounds.copyFrom(bounds);
    this._startWorldMatrix.copyFrom(startWorld);
    this._inverseStartWorldMatrix.copyFrom(inverse);

    this._proportional = event.evt.shiftKey;
    this._pickedHandler = handler;
  }

  private _setMarkerPosition(localMarker: Point) {
    const handler = this._pickedHandler!

    const markerBounds = this.context.handlersMap[handler].getBounds();
    const markerCenter = markerBounds.center;

    this._pointerToMarkerWorld.copyFrom(this.context.getWorldPointer().sub(markerCenter));
    this._markerToHandleLocal.copyFrom(localMarker.sub(this._handleLocal));
  }

  private _setActiveAxis() {
    const handler = this._pickedHandler!

    const activeXCandidates = ["left", "right", "Left", "Right"]
    const activeYCandidates = ["top", "bottom", "Top", "Bottom"]

    this._activeX = activeXCandidates.some((item) => handler.includes(item))
    this._activeY = activeYCandidates.some((item) => handler.includes(item))
  }

  private _getLocalMarker() {
    const handler = this._pickedHandler!
    const markerBounds = this.context.handlersMap[handler].getBounds();
    const markerCenter = markerBounds.center;

    return this._inverseStartWorldMatrix.applyToPoint(markerCenter);
  }

  private _setHandleLocal(localMarker: Point) {
    const bounds = this._initialBounds
    const center = bounds.center

    this._handleLocal.set(
      this._activeX
        ? (Math.abs(localMarker.x - bounds.left) <= Math.abs(localMarker.x - bounds.right)
          ? bounds.left
          : bounds.right)
        : center.x,

      this._activeY
        ? (Math.abs(localMarker.y - bounds.top) <= Math.abs(localMarker.y - bounds.bottom)
          ? bounds.top
          : bounds.bottom)
        : center.y,
    );
  }

  private _setPivotLocal() {
    const bounds = this._initialBounds
    const center = bounds.center

    this._pivotLocal.set(
      this._activeX
        ? (this._handleLocal.x === bounds.left
          ? bounds.right
          : bounds.left)
        : center.x,

      this._activeY
        ? (this._handleLocal.y === bounds.top
          ? bounds.bottom
          : bounds.top)
        : center.y,
    );
  }
}
