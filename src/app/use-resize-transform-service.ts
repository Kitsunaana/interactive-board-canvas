import type { Corner } from "@/features/board/domain/selection-area"
import type { EventObject } from "engine/behaviors/EventBehavior"
import type { Group } from "engine/core/Group"
import type { OnNodeSelect } from "engine/core/SelectionManager"
import type { SimObject } from "engine/core/SimObject"
import { CircleShape, PolygonShape } from "engine/shapes"
import { ResizeTransformOperation } from "engine/world/_transform/resize-operation"
import type { Edge } from "engine/world/_transform/transform-operation.interface"
import { ResizeTransformer } from "engine/world/TransformerV2"
import { useRef, useState } from "react"

const INITIAL_HANDLERS_STATE = {
  empty: true,
  corners: [
    { type: "Circle", x: 0, y: 0, radius: 7, zIndex: 3, attributes: { anchor: "bottomRight" } },
    { type: "Circle", x: 0, y: 0, radius: 7, zIndex: 3, attributes: { anchor: "bottomLeft" } },
    { type: "Circle", x: 0, y: 0, radius: 7, zIndex: 3, attributes: { anchor: "topRight" } },
    { type: "Circle", x: 0, y: 0, radius: 7, zIndex: 3, attributes: { anchor: "topLeft" } },
  ],
  edges: [
    { type: "Polygon", initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], zIndex: 4, attributes: { anchor: "bottom" } },
    { type: "Polygon", initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], zIndex: 4, attributes: { anchor: "right" } },
    { type: "Polygon", initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], zIndex: 4, attributes: { anchor: "left" } },
    { type: "Polygon", initialPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], zIndex: 4, attributes: { anchor: "top" } },
  ]
}

const getGroupedResizeHandlers = (children: Array<SimObject>) => {
  return children.reduce((acc, child) => {
    const anchor = child.getDataAttr<string>("anchor")
    if (!anchor) return acc

    if (PolygonShape.isPolygon(child)) acc.edge[anchor as Edge] = child
    if (CircleShape.isCircle(child)) acc.corner[anchor as Corner] = child

    return acc
  }, { edge: {}, corner: {} } as {
    edge: Record<Edge, PolygonShape>
    corner: Record<Corner, CircleShape>
  })
}

export const useResizeTransformService = () => {
  const ref = useRef({
    operation: new ResizeTransformOperation(),
    model: new ResizeTransformer()
  })

  const operation = ref.current.operation
  const model = ref.current.model

  const groupNodeRef = useRef<Group>(null)

  const [isShowTransformer, setIsShowTransormer] = useState<boolean>(false)
  const [handlers, setHandlers] = useState(INITIAL_HANDLERS_STATE)

  const selectNodes: OnNodeSelect = ({ context, objects }) => {
    const group = groupNodeRef.current!

    model.layer = group.layer
    model.setComponents(objects, context)

    if (handlers.empty) {
      const nextPositions = model.getTransformHandlerPositions(7)

      setHandlers((prev) => ({
        ...prev,
        empty: false,
        corners: prev.corners.map((corner) => ({ ...corner, ...nextPositions.corner[corner.attributes.anchor as Corner] })),
        edges: prev.edges.map((edge) => ({ ...edge, initialPoints: nextPositions.edge[edge.attributes.anchor as Edge] }))
      }))
    } else {
      model.resizeHandlerShapes = getGroupedResizeHandlers(group.children)
      model.updateHandlersPosition()
    }
    
    setIsShowTransormer(true)
  }

  const startTransform = (event: EventObject<PointerEvent>) => {
    const group = groupNodeRef.current!

    model.resizeHandlerShapes = getGroupedResizeHandlers(group.children)

    operation.initialize(model.buildContext())
    operation.startTransform(event)
  }

  const processTransform = (event: EventObject<PointerEvent>) => {
    operation.processTransform(event)
    model.updateHandlersPosition()
  }

  const finishTransform = (event: EventObject<PointerEvent>) => {
    operation.finishTransform(event)
  }

  return {
    setIsShowTransormer,
    isShowTransformer,
    processTransform,
    finishTransform,
    startTransform,

    groupNodeRef,
    selectNodes,
    operation,
    handlers,
    model,
  }
}

export type ResizeTransformServiceReturn = ReturnType<typeof useResizeTransformService>