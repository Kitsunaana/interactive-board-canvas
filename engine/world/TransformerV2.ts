import { isNil } from "lodash"
import { type TransformOperation } from "../behaviors/Transformable"
import { Matrix3x3, Point, type PointData, Polygon } from "../maths"
import { CircleShape } from "../shapes/Circle"
import { PolygonShape } from "../shapes/Polygon"
import { mapKeys } from "../utils"
import { ResizeTransformOperation } from "./_transform/resize-operation"
import { RotateTransformOperation } from "./_transform/rotate-operation"
import type { Corner, Edge, TransformState } from "./_transform/transform-operation.interface"
import { Group } from "../core/Group"
import { Node, routes } from "../core/Node"
import { Shape } from "../core/Shape"
import { getOriginInOriginalSpace, getRotateDeltaMatrix, getScaleDeltaMatrix, getTranslateDeltaMatrix } from "../behaviors/TransformerV4"
import { Layer } from "../core/Layer"

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
    bottomRight: new CircleShape({ x: 0, y: 0, radius: Transformer.ROTATE_HANDLER_RADIUS }),
    bottomLeft: new CircleShape({ x: 0, y: 0, radius: Transformer.ROTATE_HANDLER_RADIUS }),
    topRight: new CircleShape({ x: 0, y: 0, radius: Transformer.ROTATE_HANDLER_RADIUS }),
    topLeft: new CircleShape({ x: 0, y: 0, radius: Transformer.ROTATE_HANDLER_RADIUS }),
  }

  public readonly resizeHandlerShapes = {
    corner: {
      bottomRight: new CircleShape({ x: 0, y: 0, radius: Transformer.RESIZE_HANDLER_RADIUS }),
      bottomLeft: new CircleShape({ x: 0, y: 0, radius: Transformer.RESIZE_HANDLER_RADIUS }),
      topRight: new CircleShape({ x: 0, y: 0, radius: Transformer.RESIZE_HANDLER_RADIUS }),
      topLeft: new CircleShape({ x: 0, y: 0, radius: Transformer.RESIZE_HANDLER_RADIUS }),
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

  private get _child(): Node {
    return this.children[0]
  }

  public get node(): Node {
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

    this.emitter.on(routes.addToParent, this._afterAddToParentCallback.bind(this))
  }

  private _afterAddToParentCallback(): void {
    this.rotateOperation.node = this.node
    this.resizeOperation.node = this.node

    this.addHandlersToLayer(this.layer)
    this.updateHandlersPosition()

    this.children.forEach((child) => {
      child.emitter.on(routes.processDrag, () => {
        this.hideSystemUiControls()
      })

      child.emitter.on(routes.finishDrag, () => {
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
      .forEach((shape) => shape.isVisible = false)
  }

  public showSystemUiControls(): void {
    this
      .getSystemUiShapes()
      .forEach((shape) => shape.isVisible = true)
  }

  public beginInteraction(type: TransformOperation): void {
    this.transform.beginInteraction(type)
    this.children.forEach((child) => child.transform.beginInteraction(type))
  }

  public endInteraction(): void {
    this.transform.endInteraction()
    this.children.forEach((child) => child.transform.endInteraction())
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
      shape.events.on("pointerdown", this.rotateOperation.startTransform.bind(this.rotateOperation))
      shape.setDataAttr("handler", handler)
      layer.appendChild(shape)
    })

    mapKeys(this.resizeHandlerShapes.edge, (handler, shape) => {
      shape.events.on("pointerdown", this.resizeOperation.startTransform.bind(this.resizeOperation))
      shape.setDataAttr("handler", handler)
      layer.appendChild(shape)
    })

    mapKeys(this.resizeHandlerShapes.corner, (handler, shape) => {
      shape.events.on("pointerdown", this.resizeOperation.startTransform.bind(this.resizeOperation))
      shape.setDataAttr("handler", handler)
      layer.appendChild(shape)
    })

    this.updateHandlersPosition()
  }

  public updateHandlersPosition(): void {
    const padding = Transformer.OFFSET_BETWEEN_SHAPES_AND_AABB + Transformer.RESIZE_HANDLER_RADIUS * 2

    const resizePositions = this.computeTransformHandlerPositions(Transformer.OFFSET_BETWEEN_SHAPES_AND_AABB)
    const rotatePositions = this.computeTransformHandlerPositions(padding)

    const resizePadding = new Point(Transformer.RESIZE_HANDLER_RADIUS, Transformer.RESIZE_HANDLER_RADIUS)
    const rotatePadding = new Point(Transformer.ROTATE_HANDLER_RADIUS, Transformer.ROTATE_HANDLER_RADIUS)

    mapKeys(this.rotateHandlerShapes, (handler, shape) => {
      shape.position = rotatePositions.corner[handler].sub(rotatePadding)
    })
 
    mapKeys(this.resizeHandlerShapes.corner, (handler, shape) => {
      shape.position = resizePositions.corner[handler].sub(resizePadding)
    })

    mapKeys(this.resizeHandlerShapes.edge, (handler, shape) => {
      shape.setPoints(resizePositions.edge[handler])
    })
  }

  public translate(distance: PointData): void {
    if (this._isSingle) return this._child.transform.translate(distance)
    this._tempOriginRotate = null

    this.children.forEach((child) => {
      const parent = child.parent
      const deltaMatrix = getTranslateDeltaMatrix({ distance, parent })

      child.applyDeltaTransform(deltaMatrix)
    })
  }

  public rotate(angle: number): void {
    if (this._isSingle) return this._child.transform.rotate(angle)
    if (isNil(this._tempOriginRotate)) this._setTempOriginRotate()

    this.children.forEach((child) => {
      const origin = this._tempOriginRotate!
      const deltaMatrix = getRotateDeltaMatrix({ origin, angle })

      child.applyDeltaTransform(deltaMatrix)
    })
  }

  public scale(scale: Point): void {
    if (this._isSingle) return this._child.transform.scale(scale)
    this._tempOriginRotate = null

    this.children.forEach((child) => {
      const angle = 0
      const origin = this.transform.getInLocalOriginPosition("scale")
      const deltaMatrix = getScaleDeltaMatrix({ origin, angle, scale })

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

    const originRotate = composed.applyToPoint(this.node.transform.getOriginInOriginalSpace("rotate"))
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
    const origin = getOriginInOriginalSpace({
      bounds: this.getBounds({ skipTransform: false }),
      origin: Point
        .one()
        .scale(0.5),
    })

    this._tempOriginRotate = Point.fromData(origin)
  }
}
