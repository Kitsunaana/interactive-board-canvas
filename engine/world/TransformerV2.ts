import { isNil } from "lodash"
import { Transformable, type TransformOperation } from "../behaviors/Transformable"
import { Group } from "../Group"
import { Layer } from "../LayerV2"
import { Matrix3x3, Point, type PointData, Polygon } from "../maths"
import { CircleShape } from "../shapes/Circle"
import { PolygonShape } from "../shapes/Polygon"
import { Shape } from "../shapes/Shape"
import { mapKeys } from "../utils"
import { ResizeTransformOperation } from "./_transform/resize-operation"
import { RotateTransformOperation } from "./_transform/rotate-operation"
import type { Corner, Edge, TransformState } from "./_transform/transform-operation.interface"
import { SimObject } from "./sim-object"

export class Transformer extends Group {
  public static OFFSET_BETWEEN_SHAPES_AND_AABB = 7
  public static RESIZE_HANDLER_RADIUS = 5
  public static ROTATE_HANDLER_RADIUS = 9

  public static isTransformer(candidate: unknown): candidate is Transformer {
    return candidate instanceof Transformer
  }

  private _transformState: TransformState = "idle"
  private _tempOriginRotate: Point | null = null

  private _processTransform = (_event: PointerEvent) => { }
  private _finishTransform = (_event: PointerEvent) => { }

  public activeOperation: RotateTransformOperation | ResizeTransformOperation | null = null
  public rotateOperation: RotateTransformOperation
  public resizeOperation: ResizeTransformOperation

  public readonly rotateHandlerShapes: Record<Corner, CircleShape> = {
    bottomRight: new CircleShape(0, 0, Transformer.ROTATE_HANDLER_RADIUS),
    bottomLeft: new CircleShape(0, 0, Transformer.ROTATE_HANDLER_RADIUS),
    topRight: new CircleShape(0, 0, Transformer.ROTATE_HANDLER_RADIUS),
    topLeft: new CircleShape(0, 0, Transformer.ROTATE_HANDLER_RADIUS),
  }

  public readonly resizeHandlerShapes = {
    corner: {
      bottomRight: new CircleShape(0, 0, Transformer.RESIZE_HANDLER_RADIUS),
      bottomLeft: new CircleShape(0, 0, Transformer.RESIZE_HANDLER_RADIUS),
      topRight: new CircleShape(0, 0, Transformer.RESIZE_HANDLER_RADIUS),
      topLeft: new CircleShape(0, 0, Transformer.RESIZE_HANDLER_RADIUS),
    },

    edge: {
      bottom: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
      right: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
      left: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
      top: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
    },
  }

  private get _isSingle(): boolean {
    return this.children.length === 1
  }

  private get _child(): SimObject {
    return this.children[0]
  }

  public get node(): SimObject {
    if (this._isSingle) return this._child
    return this
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
    super()

    this.rotateOperation = new RotateTransformOperation(this, this.node)
    this.resizeOperation = new ResizeTransformOperation(this, this.node)

    this.emitter.on(this.routes.addToParent, this._afterAddToParentCallback.bind(this))
  }

  private _afterAddToParentCallback(): void {
    this.rotateOperation.node = this.node
    this.resizeOperation.node = this.node

    this.addHandlersToLayer(this.layer)
    this.updateHandlersPosition()

    this.children.forEach((child) => {
      child.emitter.on(child.routes.processDrag, () => {
        this.hideSystemUiControls()
      })

      child.emitter.on(child.routes.finishDrag, () => {
        this.updateHandlersPosition()
        this.showSystemUiControls()
      })
    })
  }

  public getSystemUiShapes(): Array<Shape> {
    return [this.rotateHandlerShapes, ...Object.values(this.resizeHandlerShapes)].flatMap(Object.values)
  }

  public hideSystemUiControls(): void {
    this
      .getSystemUiShapes()
      .forEach((shape) => shape.visible = false)
  }

  public showSystemUiControls(): void {
    this
      .getSystemUiShapes()
      .forEach((shape) => shape.visible = true)
  }

  public beginInteraction(type: TransformOperation): void {
    super.beginInteraction(type)
    this.children.forEach((child) => child.beginInteraction(type))
  }

  public endInteraction(): void {
    super.endInteraction()
    this.children.forEach((child) => child.endInteraction())
  }

  public removeTransformHandlersToWindow(): void {
    window.removeEventListener("pointermove", this._processTransform)
    window.removeEventListener("pointerup", this._finishTransform)
  }

  public subscribeTransformHandlersToWindow(): void {
    const operation = this.activeOperation

    if (operation) {
      this._processTransform = operation.processTransform.bind(operation)
      this._finishTransform = operation.finishTransform.bind(operation)

      window.addEventListener("pointermove", this._processTransform)
      window.addEventListener("pointerup", this._finishTransform)
    }
  }

  public addHandlersToLayer(layer: Layer): void {
    mapKeys(this.rotateHandlerShapes, (handler, shape) => {
      shape.on("pointerdown", this.rotateOperation.startTransform.bind(this.rotateOperation))
      shape.addName(handler)
      layer.appendChild(shape)
    })

    mapKeys(this.resizeHandlerShapes.edge, (handler, shape) => {
      shape.on("pointerdown", this.resizeOperation.startTransform.bind(this.resizeOperation))
      shape.addName(handler)
      layer.appendChild(shape)
    })

    mapKeys(this.resizeHandlerShapes.corner, (handler, shape) => {
      shape.on("pointerdown", this.resizeOperation.startTransform.bind(this.resizeOperation))
      shape.addName(handler)
      layer.appendChild(shape)
    })

    this.updateHandlersPosition()
  }

  public updateHandlersPosition(): void {
    const padding = Transformer.OFFSET_BETWEEN_SHAPES_AND_AABB + Transformer.RESIZE_HANDLER_RADIUS * 2

    const resizePositions = this.computeTransformHandlerPositions(Transformer.OFFSET_BETWEEN_SHAPES_AND_AABB)
    const rotatePositions = this.computeTransformHandlerPositions(padding)

    mapKeys(this.rotateHandlerShapes, (handler, shape) => {
      shape.position = rotatePositions.corner[handler]
    })

    mapKeys(this.resizeHandlerShapes.corner, (handler, shape) => {
      shape.position = resizePositions.corner[handler]
    })

    mapKeys(this.resizeHandlerShapes.edge, (handler, shape) => {
      shape.setPoints(resizePositions.edge[handler])
    })
  }

  public translate(distance: PointData): void {
    if (this._isSingle) return this._child.translate(distance)
    this._tempOriginRotate = null

    this.children.forEach((child) => {
      const parent = child.parent
      const deltaMatrix = Transformable.getTranslateDeltaMatrix({ distance, parent })

      child.applyDeltaTransform(deltaMatrix)
    })
  }

  public rotate(angle: number): void {
    if (this._isSingle) return this._child.rotate(angle)
    if (isNil(this._tempOriginRotate)) this._setTempOriginRotate()

    this.children.forEach((child) => {
      const origin = this._tempOriginRotate!
      const deltaMatrix = Transformable.getRotateDeltaMatrix({ origin, angle })

      child.applyDeltaTransform(deltaMatrix)
    })
  }

  public scale(scale: Point): void {
    if (this._isSingle) return this._child.scale(scale)
    this._tempOriginRotate = null

    this.children.forEach((child) => {
      const angle = 0
      const origin = this.getInLocalOriginPosition("scale")
      const deltaMatrix = Transformable.getScaleDeltaMatrix({ origin, angle, scale })

      child.applyDeltaTransform(deltaMatrix)
    })
  }

  public render(context: CanvasRenderingContext2D): void {
    if (this.node === this) {
      this.children.forEach((child) => {
        context.betweenSaveAndRestore(() => {
          child.cachedMatrix.applyToContext(context)
          child.render(context)
        })
      })
    } else {
      context.betweenSaveAndRestore(() => {
        this.node.cachedMatrix.applyToContext(context)
        super.render(context)
      })
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
    }
  }

  private _getPositionsForActionAppliedToSingleNode(padding: number): Array<Point> {
    const composed = Matrix3x3.compose(this.node.cachedMatrix, this.node.worldMatrix)

    const matrixForAngle = ({
      rotate: composed,
      idle: this.node.worldMatrix,
      resize: this.node.worldMatrix,
    })[this.transformState]

    const currentAngle = Math.atan2(matrixForAngle.b, matrixForAngle.a)

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

  private _getPositionsWhenActionAppliedToSetOfNodes(padding: number): Array<Point> {
    const transformedPoints = this.node.getPoints({
      applyCachedTransform: true,
      applyTransform: true,
    })

    return Polygon
      .getBounds(transformedPoints)
      .padding(padding)
      .getCorners()
  }

  private _setTempOriginRotate(): void {
    const origin = Transformable.getOriginInOriginalSpace({
      bounds: this.getBounds({ skipTransform: false }),
      origin: Point
        .one()
        .scale(0.5),
    })

    this._tempOriginRotate = Point.fromData(origin)
  }
}
