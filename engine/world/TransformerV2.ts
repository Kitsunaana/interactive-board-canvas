import { entries, values } from "lodash"
import { inverseOrIdentity } from "../behaviors/NodeTransformer"
import { Group } from "../core/Group"
import { Node } from "../core/Node"
import { Shape } from "../core/Shape"
import { Matrix3x3, Point, Polygon } from "../maths"
import { CircleShape } from "../shapes/Circle"
import { PolygonShape } from "../shapes/Polygon"
import { mapKeys } from "../utils"
import type { Corner, Edge } from "./_transform/transform-operation.interface"
import { SYSTEM_UI } from "./GradientControls/BaseGradientGroup"

export class ResizeTransformer extends Group {
  public static OFFSET_BETWEEN_SHAPES_AND_AABB = 7
  public static RESIZE_HANDLER_RADIUS = 5

  public static isTransformer(candidate: unknown): candidate is ResizeTransformer {
    return candidate instanceof ResizeTransformer
  }

  public readonly resizeHandlerShapes = {
    edge: {
      bottom: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
      right: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
      left: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
      top: new PolygonShape({ initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }),
    },
    corner: {
      bottomRight: new CircleShape({ x: 0, y: 0, radius: ResizeTransformer.RESIZE_HANDLER_RADIUS }),
      bottomLeft: new CircleShape({ x: 0, y: 0, radius: ResizeTransformer.RESIZE_HANDLER_RADIUS }),
      topRight: new CircleShape({ x: 0, y: 0, radius: ResizeTransformer.RESIZE_HANDLER_RADIUS }),
      topLeft: new CircleShape({ x: 0, y: 0, radius: ResizeTransformer.RESIZE_HANDLER_RADIUS }),
    },
  }

  public get node(): Node {
    return this.nodesToTransform[0]
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

  public nodesToTransform: Array<Node> = []

  public setShapes(nodes: Array<Node>) {
    this.removeShapes()
    this.nodesToTransform = nodes

    this.addHandlersToLayer()
    this.updateHandlersPosition()
  }

  public removeShapes() {
    this.nodesToTransform = []
    this.handlers.forEach((handler) => handler.destroy())
  }

  public render(context: CanvasRenderingContext2D): void {
    if (this.node === this) {
      this.children.forEach((child) => child.render(context))
    } else {
      super.render(context)
    }
  }

  public addHandlersToLayer(): void {
    Object
      .values(this.resizeHandlerShapes)
      .flatMap((r) => entries(r))
      .forEach(([handleName, shape]) => {
        shape.setDataAttr("handler", handleName)
        shape.addName(SYSTEM_UI)

        this.layer.appendChild(shape)
      })
  }

  public updateHandlersPosition(): void {
    const resizePositions = this.computeTransformHandlerPositions(ResizeTransformer.OFFSET_BETWEEN_SHAPES_AND_AABB)

    mapKeys(this.resizeHandlerShapes.corner, (handler, shape) => {
      shape.position = resizePositions.corner[handler]
    })

    mapKeys(this.resizeHandlerShapes.edge, (handler, shape) => {
      shape.setPoints(resizePositions.edge[handler])
    })
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
    const worldMatrix = this.node.worldMatrix

    const orientationSource = this.node.transform.startWorldMatrix ?? worldMatrix
    const orientation = orientationSource.getResizeBasis()

    const origin = orientationSource.applyToPoint(this.node.transform.getOriginInOriginalSpace("rotate"))

    const orientationAroundOrigin = Matrix3x3.aroundOrigin(origin, () => orientation)

    const inverseOrientation = inverseOrIdentity(orientationAroundOrigin)

    const matrix = Matrix3x3.compose(inverseOrientation, worldMatrix)

    const bounds = this.node.getBounds({ skipTransform: true })

    const points = bounds.getCorners().map(matrix.applyToPoint.bind(matrix))
    const scaledBounds = Polygon.getBounds(points).padding(padding)

    return scaledBounds
      .getCorners()
      .map(orientationAroundOrigin.applyToPoint.bind(orientationAroundOrigin))
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
}
