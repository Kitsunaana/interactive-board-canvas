import { isNil } from "lodash";
import { Transformable, type TransformOperation } from "../behaviors/Transformable";
import { Group } from "../Group";
import { LayerV2 } from "../LayerV2";
import { Matrix3x3, Point, type PointData, Polygon } from "../maths";
import { EllipseShape } from "../shapes/Ellipse";
import { PolygonShape } from "../shapes/Polygon";
import { mapKeys } from "../utils";
import { ResizeTransformOpearation } from "./_transform/resize-operation";
import { RotateTransformOpearation } from "./_transform/rotate-operation";
import type { Corner, Edge, TransformState } from "./_transform/transform-operation.interface";
import { SimObject } from "./sim-object";

const r2 = 9
const r = 5

export class TransformerV2 extends Group {
  public static isTransformer(candidate: unknown): candidate is TransformerV2 {
    return candidate instanceof TransformerV2
  }

  private _transformState: TransformState = "idle";
  private _tempOriginRotate: Point | null = null

  public activeOperation: RotateTransformOpearation | ResizeTransformOpearation | null = null
  public rotateOperation: RotateTransformOpearation
  public resizeOperation: ResizeTransformOpearation

  public readonly rotateHandlerShapes: Record<Corner, EllipseShape> = {
    bottomRight: new EllipseShape(0, 0, r2, r2),
    bottomLeft: new EllipseShape(0, 0, r2, r2),
    topRight: new EllipseShape(0, 0, r2, r2),
    topLeft: new EllipseShape(0, 0, r2, r2),
  }

  public readonly resizeHandlerShapes = {
    edge: {
      bottom: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
      right: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
      left: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
      top: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
    },

    corner: {
      bottomRight: new EllipseShape(0, 0, r, r),
      bottomLeft: new EllipseShape(0, 0, r, r),
      topRight: new EllipseShape(0, 0, r, r),
      topLeft: new EllipseShape(0, 0, r, r),
    }
  };

  private _processTransform(_event: PointerEvent) {
  }

  private _finishTransform(_event: PointerEvent) {
  }

  private get _isSingle(): boolean {
    return this.children().length === 1;
  }

  private get _child(): SimObject {
    return this.children()[0];
  }

  public get node(): SimObject {
    if (this._isSingle) return this._child;
    return this;
  }

  public get transformState() {
    return this._transformState
  }

  public set transformState(next: TransformState) {
    this.activeOperation = ({
      idle: null,
      rotate: this.rotateOperation,
      resize: this.resizeOperation,
    })[next]

    this._transformState = next

    if (!isNil(this.activeOperation)) {
      this.removeTransformHandlersToWindow()
      this.subscribeTransformHandlersToWindow()
    }
  }

  public constructor() {
    super();

    this.rotateOperation = new RotateTransformOpearation(this, this.node)
    this.resizeOperation = new ResizeTransformOpearation(this, this.node)

    this.on("addToParent", () => {
      const layer = this.layer()!

      this.rotateOperation.node = this.node
      this.resizeOperation.node = this.node

      this.addHandlersToLayer(layer)
      this.updateHandlersPosition()
    });
  }

  public updateAfterTransform(): void {
    super.updateAfterTransform()
    this.updateHandlersPosition()
  }

  public beginInteraction(type: TransformOperation): void {
    super.beginInteraction(type)
    this.children().forEach((child) => child.beginInteraction(type))
  }

  public endInteraction(): void {
    super.endInteraction()
    this.children().forEach((child) => child.endInteraction())
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

  public addHandlersToLayer(layer: LayerV2) {
    mapKeys(this.rotateHandlerShapes, (handler, shape) => {
      shape.on("pointerdown", this.rotateOperation.startTransform.bind(this.rotateOperation))
      shape.addClassname(handler)
      layer.children(shape);
    });

    mapKeys(this.resizeHandlerShapes.edge, (handler, shape) => {
      shape.on("pointerdown", this.resizeOperation.startTransform.bind(this.resizeOperation))
      shape.addClassname(handler)
      layer.children(shape);
    });

    mapKeys(this.resizeHandlerShapes.corner, (handler, shape) => {
      shape.on("pointerdown", this.resizeOperation.startTransform.bind(this.resizeOperation))
      shape.addClassname(handler)
      layer.children(shape);
    });

    this.updateHandlersPosition()
  }

  public updateHandlersPosition() {
    const padding = 7 + r * 2

    const rotatePositions = this.computeTransformHandlerPositions(padding);
    const resizePositions = this.computeTransformHandlerPositions(7);

    mapKeys(this.rotateHandlerShapes, (handler, shape) => {
      shape.positionV2(rotatePositions.corner[handler])
    })

    mapKeys(this.resizeHandlerShapes.corner, (handler, shape) => {
      shape.positionV2(resizePositions.corner[handler])
    })

    mapKeys(this.resizeHandlerShapes.edge, (handler, shape) => {
      // shape.initialPoints(resizePositions.edge[handler])
    })
  }

  public translate(distance: PointData): void {
    if (this._isSingle) return this._child.translate(distance);

    this._tempOriginRotate = null

    this
      .children()
      .forEach((child) => {
        child.applyDeltaTransform(Transformable.getTranslateDeltaMatrix({
          parent: child.parent(),
          distance
        }))
      })
  }

  public rotate(angle: number): void {
    if (this._isSingle) return this._child.rotate(angle);

    if (isNil(this._tempOriginRotate)) this._setTempOriginRotate()

    this.children().forEach((child) => {
      child.applyDeltaTransform(Transformable.getRotateDeltaMatrix({
        origin: this._tempOriginRotate!,
        angle
      }))
    })
  }

  public scale(scale: Point): void {
    if (this._isSingle) return this._child.scale(scale);

    this._tempOriginRotate = null

    this.children().forEach((child) => {
      child.applyDeltaTransform(Transformable.getScaleDeltaMatrix({
        origin: this.getInLocalOriginPosition("scale"),
        angle: 0,
        scale,
      }))
    })
  }

  public render(context: CanvasRenderingContext2D): void {
    if (this.node === this) {
      this.children().forEach((child) => {
        context.save()
        child.cachedMatrix.applyToContext(context)
        child.render(context)
        context.restore()
      })
    } else {
      context.save();
      this.node.cachedMatrix.applyToContext(context);
      super.render(context);
      context.restore();
    }
  }

  public computeTransformHandlerPositions(padding: number) {
    const mappedCorners = this.node === this
      ? this._getPositionsWhenActionAppliedToSetOfNodes(padding)
      : this._getPositionsForActionAppliedToSingleNode(padding)

    return {
      corner: {
        bottomRight: mappedCorners[2],
        bottomLeft: mappedCorners[3],
        topRight: mappedCorners[1],
        topLeft: mappedCorners[0],
      } as Record<Corner, Point>,

      edge: {
        bottom: [mappedCorners[2], mappedCorners[3]],
        right: [mappedCorners[1], mappedCorners[2]],
        left: [mappedCorners[3], mappedCorners[0]],
        top: [mappedCorners[0], mappedCorners[1]],
      } as Record<Edge, Array<Point>>
    };
  }

  private _getPositionsForActionAppliedToSingleNode(padding: number) {
    const composed = Matrix3x3.compose(this.node.cachedMatrix, this.node.worldMatrix)

    const forAngle = ({
      rotate: composed,
      idle: this.node.worldMatrix,
      resize: this.node.worldMatrix,
    })[this.transformState];

    const currentAngle = Math.atan2(forAngle.b, forAngle.a)

    const originRotate = composed.applyToPoint(this.node.getOriginInOriginalSpace("rotate"))
    const unrotate = Matrix3x3.aroundOrigin(originRotate, () => Matrix3x3.rotate(-currentAngle))
    const rotate = Matrix3x3.aroundOrigin(originRotate, () => Matrix3x3.rotate(currentAngle))

    const matrix = Matrix3x3.compose(unrotate, composed)
    const bounds = this.node.getBounds({ skipTransform: true })
    const corners = bounds.getCorners()
    const points = corners.map(matrix.applyToPoint.bind(matrix))
    const scaledBounds = Polygon.getBounds(points).padding(padding)
    const nextCorners = scaledBounds.getCorners()

    return nextCorners.map(rotate.applyToPoint.bind(rotate))
  }

  private _getPositionsWhenActionAppliedToSetOfNodes(padding: number) {
    const transformedPoints = this
      .getFlatListChildren()
      .flatMap((child) => {
        const matrix = Matrix3x3.compose(child.cachedMatrix, child.worldMatrix)
        return child.getPoints().map(matrix.applyToPoint.bind(matrix))
      })

    return Polygon
      .getBounds(transformedPoints)
      .padding(padding)
      .getCorners()
  }

  private _setTempOriginRotate() {
    const origin = Transformable.getOriginInOriginalSpace({
      bounds: this.getBounds({ skipTransform: false }),
      origin: Point
        .one()
        .scale(0.5),
    })

    this._tempOriginRotate = Point.fromData(origin)
  }
}
