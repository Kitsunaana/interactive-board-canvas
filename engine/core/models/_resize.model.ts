import { Layer } from "../Layer";
import { ResizeTransformer } from "../../world/TransformerV2";
import type { SelectableNode } from "../SelectionManager";
import { ResizeTransformOperation } from "../../world/_transform/resize-operation";
import { SimObject } from "../SimObject";
import { Matrix3x3, Point, Polygon, Rectangle } from "../../maths";
import { getAbsolutePosition, getNormalizedPosition } from "../../shared/point";

export class ResizeTransformModel {
  public selected: Set<SelectableNode> = new Set()

  public group: ResizeTransformer = new ResizeTransformer()
  public operation: ResizeTransformOperation = new ResizeTransformOperation()

  public constructor(private readonly layer: Layer) {
    this.layer.appendChild(this.group)
  }

  private _getMatrixRelativeToGroupV2(child: SimObject, commonParent: SimObject): Matrix3x3 {
    const chain: Matrix3x3[] = []

    let current: SimObject | null = child

    while (current && current !== commonParent) {
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

  public getBoundsV2(nodes: Array<SimObject>, commonParent: SimObject): Rectangle {
    const allPoints = nodes.flatMap((simObject) => {
      const matrix = this._getMatrixRelativeToGroupV2(simObject, commonParent)

      return simObject
        .getPoints({ applyTransform: false })
        .map(matrix.applyToPoint.bind(matrix))
    })

    return Polygon.getBounds(allPoints)
  }

  public select(commonParent: SimObject, ...nodes: Array<SimObject>) {
    this.group.setShapes(nodes)

    this.group.debugRender = (context) => {
      this.operation.debugRender(context)
    }

    if (nodes.length > 1) {
      const groupBounds = this.getBoundsV2(nodes, commonParent)
      const worldMatrix = commonParent.worldMatrix.clone()

      this.operation.initialize({
        beginInteraction: (type) => nodes.forEach((node) => node.beginInteraction(type)),
        updateInteraction: (scale) => nodes.forEach((node) => node.updateInteraction(scale)),
        endInteraction: () => nodes.forEach((node) => node.endInteraction()),

        setOrigin: (type, relativePosition) => {
          const bounds = groupBounds
          const absolutePosition = getAbsolutePosition(Point.fromData(relativePosition), bounds)

          nodes.forEach((node) => {
            const nodeBounds = node.bounds // Кешированное значение, обновится только после endInteraction
            const nextRelativePosition = getNormalizedPosition(absolutePosition, nodeBounds)

            node.setOrigin(type, nextRelativePosition)
          })
        },

        getBounds: () => groupBounds, //this.getBoundsV2(nodes, commonParent),

        getWorldPointer: () => this.group.layer.worldPointer,
        getWorldMatrix: () => worldMatrix,

        handlersMap: this.group.mergedResizeHandlers,
      })
    }

    if (nodes.length === 1) {
      const simObject = nodes[0]

      this.operation.initialize({
        beginInteraction: (type) => simObject.beginInteraction(type),
        updateInteraction: (value) => simObject.updateInteraction(value),
        endInteraction: () => simObject.endInteraction(),

        setOrigin: (type, relativePosition) => simObject.setOrigin(type, relativePosition),

        getBounds: () => simObject.getBounds({ skipTransform: true }),

        getWorldPointer: () => simObject.layer.worldPointer,
        getWorldMatrix: () => simObject.worldMatrix,

        handlersMap: this.group.mergedResizeHandlers,
      })
    }
  }

  public destroy() {
    this.group.removeShapes()
  }
}
