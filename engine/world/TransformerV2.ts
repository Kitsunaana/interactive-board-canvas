import {entries, values} from "lodash"
import {aroundWorldOrigin, inverseOrIdentity, inWorldAxes, type TransformOperation} from "../behaviors/NodeTransformer"
import {Group} from "../core/Group"
import {Shape} from "../core/Shape"
import {Matrix3x3, Point, type PointData, Polygon, Rectangle} from "../maths"
import {CircleShape} from "../shapes/Circle"
import {PolygonShape} from "../shapes/Polygon"
import {mapKeys} from "../utils"
import type {Corner, Edge} from "./_transform/transform-operation.interface"
import {SYSTEM_UI} from "./GradientControls/BaseGradientGroup"
import {SimObject} from "../core/SimObject";
import {getAbsolutePosition} from "../shared/point";
import type {ResizeOperationContext} from "./_transform/resize-operation";
import {Layer} from "../core/Layer";

const pointsToCorners = <T extends PointData>(list: Array<T>): Record<Corner, T> => {
  return {
    bottomRight: list[2],
    bottomLeft: list[3],
    topRight: list[1],
    topLeft: list[0],
  }
}

const pointsToEdge = <T extends PointData>(list: Array<T>): Record<Edge, [T, T]> => {
  return {
    bottom: [list[2], list[3]],
    right: [list[1], list[2]],
    left: [list[3], list[0]],
    top: [list[0], list[1]],
  }
}

export class ResizeTransformer {
  public static OFFSET_BETWEEN_SHAPES_AND_AABB = 7
  public static RESIZE_HANDLER_RADIUS = 5

  public static isTransformer(candidate: unknown): candidate is ResizeTransformer {
    return candidate instanceof ResizeTransformer
  }

  public commonParent!: SimObject
  public nodesToTransform: Array<SimObject> = []

  public readonly resizeHandlerShapes = {
    edge: {
      bottom: new PolygonShape({initialPoints: [{x: 0, y: 0}, {x: 0, y: 0}]}),
      right: new PolygonShape({initialPoints: [{x: 0, y: 0}, {x: 0, y: 0}]}),
      left: new PolygonShape({initialPoints: [{x: 0, y: 0}, {x: 0, y: 0}]}),
      top: new PolygonShape({initialPoints: [{x: 0, y: 0}, {x: 0, y: 0}]}),
    },
    corner: {
      bottomRight: new CircleShape({x: 0, y: 0, radius: ResizeTransformer.RESIZE_HANDLER_RADIUS}),
      bottomLeft: new CircleShape({x: 0, y: 0, radius: ResizeTransformer.RESIZE_HANDLER_RADIUS}),
      topRight: new CircleShape({x: 0, y: 0, radius: ResizeTransformer.RESIZE_HANDLER_RADIUS}),
      topLeft: new CircleShape({x: 0, y: 0, radius: ResizeTransformer.RESIZE_HANDLER_RADIUS}),
    },
  }

  public get mergedResizeHandlers() {
    return Object
      .keys(this.resizeHandlerShapes)
      .reduce((acc, key) => (Object.assign(
        acc,
        this.resizeHandlerShapes[key as keyof typeof this.resizeHandlerShapes]
      )), {} as Record<Corner | Edge, Shape>)
  }

  public get handlers(): Array<Shape> {
    return Object
      .values(this.resizeHandlerShapes)
      .flatMap((record) => values(record))
  }

  public constructor(private readonly layer: Layer) {}

  public initialize(objects: Array<SimObject>, context: SimObject) {
    this.removeObjects()
    this.setObjects(objects)
    this.commonParent = context
  }

  public setObjects(nodes: Array<SimObject>) {
    this.nodesToTransform = nodes

    this._addHandlersToLayer()
    this.updateHandlersPosition()
  }

  public removeObjects() {
    this.nodesToTransform = []
    this.handlers.forEach((handler) => handler.destroy())
  }

  public buildContext() {
    if (this.nodesToTransform.length > 1) return this._buildMultiselectContext()
    if (this.nodesToTransform.length === 1) return this._buildSingleContext()
    throw new Error("No one SimObject found")
  }

  public updateHandlersPosition(): void {
    const resizePositions = this._computeTransformHandlerPositions(ResizeTransformer.OFFSET_BETWEEN_SHAPES_AND_AABB)

    mapKeys(this.resizeHandlerShapes.corner, (handler, shape) => {
      shape.position = resizePositions.corner[handler]
    })

    mapKeys(this.resizeHandlerShapes.edge, (handler, shape) => {
      shape.setPoints(resizePositions.edge[handler])
    })
  }

  private _addHandlersToLayer(): void {
    Object
      .values(this.resizeHandlerShapes)
      .flatMap((r) => entries(r))
      .forEach(([handleName, shape]) => {
        shape.setDataAttr("handler", handleName)
        shape.addName(SYSTEM_UI)

        this.layer.appendChild(shape)
      })
  }

  private _computeTransformHandlerPositions(padding: number) {
    const shareParent = this.nodesToTransform.every((node) => node.parent === this.commonParent)

    const mappedCorners = shareParent
      ? this._getPositionsForActionAppliedToSingleNode(padding)
      : this._getPositionsWhenActionAppliedToSetOfNodes(padding)

    return {
      corner: pointsToCorners(mappedCorners),
      edge: pointsToEdge(mappedCorners),
    }
  }

  private get _worldMatrix() {
    return this.commonParent.worldMatrix
  }

  private _getOriginInOriginalSpace(_operation: TransformOperation): Point {
    return getAbsolutePosition(new Point(0.5, 0.6), this._getBounds())
  }

  private _getLeafShapes(node: SimObject): Array<Shape> {
    if (Shape.isShape(node)) return [node]
    if (Group.isGroup(node)) return node.getShapes()
    return []
  }

  private _getWorldBounds(): Rectangle {
    const allPoints = this.nodesToTransform.flatMap((node) =>
      this._getLeafShapes(node).flatMap((shape) =>
        shape
          .getPoints({applyTransform: false})
          .map(shape.worldMatrix.applyToPoint.bind(shape.worldMatrix))
      )
    )

    return Polygon.getBounds(allPoints)
  }

  private _getBounds() {
    const allPoints = this.nodesToTransform.flatMap((simObject) => {
      return this
        ._getLeafShapes(simObject)
        .flatMap((shape) => {
          const matrix = this._getMatrixRelativeToGroup(shape)

          return shape
            .getPoints({applyTransform: false})
            .map(matrix.applyToPoint.bind(matrix))
        })
    })

    return Polygon.getBounds(allPoints)
  }

  private _getMatrixRelativeToGroup(child: SimObject): Matrix3x3 {
    const chain: Matrix3x3[] = []

    let current: SimObject | null = child

    while (current && current !== this.commonParent) {
      const effectiveLocal = current.isInteracting
        ? Matrix3x3.multiply(current.cachedMatrix, current.localMatrix)
        : current.localMatrix

      chain.unshift(effectiveLocal)
      current = current.parent
    }

    return chain.length === 0
      ? Matrix3x3.identity()
      : Matrix3x3.compose(...chain)
  }

  private _buildSingleContext(): ResizeOperationContext {
    const simObject = this.nodesToTransform[0]

    return {
      beginInteraction: (type) => simObject.beginInteraction(type),
      updateInteraction: (value) => simObject.updateInteraction(value),
      endInteraction: () => simObject.endInteraction(),

      setOrigin: (type, relativePosition) => simObject.setOrigin(type, relativePosition),

      getBounds: () => simObject.getBounds({skipTransform: true}),

      getWorldPointer: () => simObject.layer.worldPointer,
      getWorldMatrix: () => simObject.worldMatrix,

      handlersMap: this.mergedResizeHandlers,
    }
  }

  private _buildMultiselectContext(): ResizeOperationContext {
    const nodes = this.nodesToTransform
    const commonParent = this.commonParent
    const shareParent = nodes.every((node) => node.parent === commonParent)

    const groupBounds = shareParent ? this._getBounds() : this._getWorldBounds()
    const worldMatrix = shareParent ? commonParent.worldMatrix.clone() : Matrix3x3.identity()
    const originWorld = new Point()

    return {
      beginInteraction: (type) => nodes.forEach((node) => node.beginInteraction(type)),
      endInteraction: () => nodes.forEach((node) => node.endInteraction()),

      updateInteraction: (scale) => {
        const scaleInWorldAxes = inWorldAxes(worldMatrix, Matrix3x3.scale(scale.x, scale.y))
        const deltaWorld = aroundWorldOrigin(originWorld, scaleInWorldAxes)

        nodes.forEach((node) => node.applyInteractionWorldDelta(deltaWorld))
      },

      setOrigin: (_type, relativePosition) => {
        const originInCommonParent = getAbsolutePosition(Point.fromData(relativePosition), groupBounds)
        originWorld.copyFrom(worldMatrix.applyToPoint(originInCommonParent))
      },

      getWorldPointer: () => this.layer.worldPointer,

      getWorldMatrix: () => worldMatrix,
      getBounds: () => groupBounds,

      handlersMap: this.mergedResizeHandlers,
    }
  }

  private _getPositionsForActionAppliedToSingleNode(padding: number): Array<Point> {
    const worldMatrix = this._worldMatrix

    const orientationSource = this._worldMatrix
    const orientation = orientationSource.getResizeBasis()

    const origin = orientationSource.applyToPoint(this._getOriginInOriginalSpace("rotate"))

    const orientationAroundOrigin = Matrix3x3.aroundOrigin(origin, () => orientation)
    const inverseOrientation = inverseOrIdentity(orientationAroundOrigin)

    const matrix = Matrix3x3.compose(inverseOrientation, worldMatrix)
    const bounds = this._getBounds()

    const points = bounds
      .getCorners()
      .map((point) => matrix.applyToPoint(point))

    const scaledBounds = Polygon
      .getBounds(points)
      .padding(padding)

    return scaledBounds
      .getCorners()
      .map((point) => orientationAroundOrigin.applyToPoint(point))
  }

  private _getPositionsWhenActionAppliedToSetOfNodes(offset: number): Array<Point> {
    return this
      ._getWorldBounds()
      .padding(offset)
      .getCorners()
  }
}
