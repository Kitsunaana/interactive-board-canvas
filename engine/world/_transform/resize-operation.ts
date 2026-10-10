import type { EventObject } from "../../behaviors/EventBehavior_v2";
import { EPSILON, inverseOrIdentity } from "../../behaviors/NodeTransformer";
import { Node } from "../../core/Node";
import { Matrix3x3, Point, type PointData, Rectangle } from "../../maths";
import { ResizeTransformer } from "../TransformerV2";
import type { Corner, Edge } from "./transform-operation.interface";

type ResizeHandler = Corner | Edge;

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

  public context!: ResizeTransformer;
  public node!: Node;

  public initialize(context: ResizeTransformer, node: Node): void {
    this.context = context;
    this.node = node;
  }

  public startTransform(event: EventObject<PointerEvent>): void {
    this._setInitialState(event)

    const localMarker = this._getLocalMarker()

    this._setActiveAxis()
    this._setHandleLocal(localMarker)
    this._setPivotLocal()
    this._setMarkerPosition(localMarker)
    this._setScaleOrigin();

    this.node.transform.beginInteraction("scale");

    this._transformScale.set(1, 1);
    this._started = true;
  }

  public processTransform(event: EventObject<PointerEvent>): void {
    if (!this._started || !this._pickedHandler) return;

    this._proportional = event.evt.shiftKey;

    this._setTrnasformScale()
    this._setScaleOrigin();

    this.node.transform.updateInteraction(this._transformScale);
    this.context.updateHandlersPosition();
  }

  public finishTransform(_event: EventObject<PointerEvent>): void {
    if (!this._started) return;

    if (this._transformScale.x === 0) this._transformScale.x = 0.001;
    if (this._transformScale.y === 0) this._transformScale.y = 0.001;

    this.node.transform.updateInteraction(this._transformScale);
    this.node.transform.endInteraction();

    this.context.updateHandlersPosition();

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

    this.node.transform.setOrigin("scale", {
      x: rx,
      y: ry,
    });
  }

  private _setTrnasformScale() {
    const markerWorld = this.node.layer.worldPointer.sub(this._pointerToMarkerWorld);
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

    const startWorld = this.node.transform.worldMatrix;
    const inverse = inverseOrIdentity(startWorld);

    const bounds = this.node.getBounds({ skipTransform: true });

    this._initialBounds.copyFrom(bounds);
    this._startWorldMatrix.copyFrom(startWorld);
    this._inverseStartWorldMatrix.copyFrom(inverse);

    this._proportional = event.evt.shiftKey;
    this._pickedHandler = handler;
  }

  private _setMarkerPosition(localMarker: Point) {
    const handler = this._pickedHandler!

    const markerBounds = this.context.mergedResizeHandlers[handler].getBounds();
    const markerCenter = markerBounds.center;

    this._pointerToMarkerWorld.copyFrom(this.node.layer.worldPointer.sub(markerCenter));
    this._markerToHandleLocal.copyFrom(localMarker.sub(this._handleLocal));
  }

  private _setActiveAxis() {
    const handler = this._pickedHandler!

    const activeXCandidates = ["left", "right", "Left", "Right"]
    const activeYCandidates = ["top", "bottom", "Top", "Bottom"]

    const activeX_ = activeXCandidates.some((item) => handler.includes(item))
    const activeY_ = activeYCandidates.some((item) => handler.includes(item))

    this._activeX = activeX_
    this._activeY = activeY_
  }

  private _getLocalMarker() {
    const handler = this._pickedHandler!
    const markerBounds = this.context.mergedResizeHandlers[handler].getBounds();
    const markerCenter = markerBounds.center;

    const localMarker = this._inverseStartWorldMatrix.applyToPoint(markerCenter);

    return localMarker
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
