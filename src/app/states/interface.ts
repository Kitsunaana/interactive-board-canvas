import type { EventObject } from "engine/behaviors/EventBehavior.ts";
import type { Background } from "engine/world/BG.ts";
import {
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  type SetStateAction
} from "react";
import type { CircleProps } from "engine";
import type { PolygonProps } from "engine/react/Polygon";
import type { NodeProps } from "engine/react/Node";
import type { NodelModelReturn } from "../use-nodes-model";
import type { ResizeTransformServiceReturn } from "../use-resize-transform-service";

export type CircleViewModel = { type: "Circle" } & CircleProps

export type PolygonViewModel = { type: "Polygon" } & PolygonProps

export type ShapeViewModel = { id: string } & (CircleViewModel | PolygonViewModel)

export type GroupViewModel = { type: "Group" } & { nestedList: Array<NodeViewModel> }

export type NodeViewModel = { id: string } & (CircleViewModel | PolygonViewModel | GroupViewModel)

export type ViewModel = {
  nodes: Array<NodeViewModel>
  stage: {
    onWheel?: (event: ReactWheelEvent<HTMLDivElement>) => void
    onKeyDown?: (event: ReactKeyboardEvent) => void
    onPointerLeave?: (event: ReactPointerEvent) => void
  }
  layer: {
    onPointerDown?: (event: EventObject<PointerEvent, Background>) => void
    onPointerMove?: (event: EventObject<PointerEvent, Background>) => void
    onPointerUp?: (event: EventObject<PointerEvent, Background>) => void
    onPointerLeave?: (event: EventObject<PointerEvent, Background>) => void
    render?: (event: EventObject) => void
  },
  resizer: {
    handlers: Array<NodeProps>
  }
}

export type ViewModelParams = {
  nodesModel: NodelModelReturn
  resizerModel: ResizeTransformServiceReturn
  setViewState: Dispatch<SetStateAction<ViewState>>
  getLayer: () => Background
}

export type IdleViewState = {
  type: "idle"
}

export type PanningViewState = {
  type: "panning"
}

export type ResizingViewState = {
  type: "resizing"
}


export type ViewState =
  | IdleViewState
  | PanningViewState
  | ResizingViewState

export const goToIdleState = (): IdleViewState => {
  return {
    type: "idle"
  }
}

export const goToPanningState = (): PanningViewState => {
  return {
    type: "panning"
  }
}

export const goToResizingState = (): ResizingViewState => {
  return {
    type: "resizing"
  }
}

