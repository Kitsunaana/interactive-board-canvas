import { bind } from "@react-rxjs/core";
import { BehaviorSubject, map } from "rxjs";
import type { Point } from "./type";

type IdleViewModel = {
  type: "idle"
  mouseDown?: Point
}

type NodesDraggingViewModel = {
  type: "nodes-dragging"
  selectedIds: Set<string>
}

type ViewModelState = IdleViewModel | NodesDraggingViewModel

type ViewModel = {
  nodes: string[]
  actions?: {
    remove?: () => void
  }
}

export const viewModelState = new BehaviorSubject<ViewModelState>({
  type: "idle",
})

const idleViewState = (_state: IdleViewModel): ViewModel => ({
  nodes: [],
  actions: {
    remove: () => {
      console.log("remove from IDLE state")
    }
  }
})

const nodesDraggingViewState = (state: NodesDraggingViewModel): ViewModel => ({
  nodes: [...state.selectedIds],
  actions: {
    remove: () => {
      console.log("remove from NODES-DRAGGING state")
    }
  }
})

export const viewModel$ = viewModelState.pipe(map((state) => {
  switch (state.type) {
    case "nodes-dragging": return nodesDraggingViewState(state)
    case "idle": return idleViewState(state)
    default: throw new Error("invalid state.type")
  }
}))

export const [useViewModel] = bind(viewModel$, {
  nodes: [],
})