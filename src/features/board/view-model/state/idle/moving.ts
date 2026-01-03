import type { Point } from "@/shared/type/shared.ts";
import { isNil } from "lodash";
import type { Node } from "../../../domain/node.ts";
import type { Camera } from "../../../modules/_camera";
import { viewModelState$ } from "../index.ts";
import type { IdleViewState } from "../type.ts";
import { moveSelectedNodes } from "./selection.ts";

export const startMoveOneNode = ({ event, node, nodes, point }: {
  event: PointerEvent
  nodes: Node[]
  point: Point
  node: Node
}) => {
  const currentState = viewModelState$.getValue() as IdleViewState

  if (!currentState.selectedIds.has(node.id) && !event.ctrlKey) {
    viewModelState$.next({
      ...currentState,
      mouseDown: point,
      selectedIds: new Set(node.id),
    })
  }

  return nodes
}

export const movingOneNode = ({ nodes, camera, point, event }: {
  event: PointerEvent
  camera: Camera
  nodes: Node[]
  point: Point
}) => {
  const currentState = viewModelState$.getValue() as IdleViewState
  const selectedIds = currentState.selectedIds

  return moveSelectedNodes({ selectedIds, camera, point, nodes, event })
}

export const endMoveOneNode = ({ nodes }: { nodes: Node[] }) => {
  const currentState = viewModelState$.getValue() as IdleViewState

  if (!isNil(currentState.mouseDown)) {
    viewModelState$.next({
      ...currentState,
      mouseDown: undefined,
      selectedIds: new Set()
    })
  }

  return nodes
}
