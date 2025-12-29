import { toRGB, type NodeToView } from "../../nodes"
import { addPoint, getPointFromEvent, screenToCanvas, subtractPoint } from "../../point"
import type { Point } from "../../type"
import { _u } from "../../utils"
import type { Camera } from "../camera"
import { selectItems, type IdleViewState } from "../view-model"

export const pickColorIdByPoint = ({ camera, context, event }: {
  context: CanvasRenderingContext2D
  event: PointerEvent
  camera: Camera
}) => {
  const pointFromEvent = getPointFromEvent(event)
  const pointOnScreen = screenToCanvas({
    camera,
    point: pointFromEvent,
  })

  const pixelData = context.getImageData(pointFromEvent.x, pointFromEvent.y, 1, 1)
  const [red, green, blue] = pixelData.data
  const pickedColorId = toRGB(red, green, blue)

  return {
    colorId: pickedColorId,
    point: pointOnScreen,
  }
}

export const findNodeByColorId = ({ nodes, event, camera, context }: {
  context: CanvasRenderingContext2D
  event: PointerEvent
  nodes: NodeToView[]
  camera: Camera
}) => {
  const { colorId, point } = pickColorIdByPoint({ context, camera, event })
  const node = nodes.find((node) => node.colorId === colorId)

  return {
    colorId,
    point,
    event,
    node,
  }
}

export const moveSelectedNodes = ({ camera, nodes, point, event, selectedIds }: {
  selectedIds: Set<string>
  nodes: NodeToView[]
  event: PointerEvent
  camera: Camera
  point: Point
}) => {
  const windowPoint = getPointFromEvent(event)
  const pointerMoveWorldPoint = screenToCanvas({
    point: windowPoint,
    camera,
  })

  return (
    nodes.map((node) => {
      if (selectedIds.has(node.id)) {
        return _u.merge(
          node,
          addPoint(
            node,
            subtractPoint(point, pointerMoveWorldPoint)
          )
        )
      }

      return node
    })
  )
}


export const nodesSelection = ({ event, node, viewModelState }: {
  viewModelState: IdleViewState
  event: PointerEvent
  node: NodeToView
}): IdleViewState => {
  const hasPressedKeys = event.ctrlKey || event.shiftKey

  if (viewModelState.selectedIds.has(node.id) && !hasPressedKeys) {
    return viewModelState
  }

  return {
    ...viewModelState,
    selectedIds: selectItems({
      modif: hasPressedKeys ? "toggle" : "replace",
      initialSelected: viewModelState.selectedIds,
      ids: [node.id],
    })
  }
}