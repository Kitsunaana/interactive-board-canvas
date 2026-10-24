import { useRef, useState } from "react"
import type { ResizeTransformServiceReturn } from "../use-resize-transform-service"
import type { Background } from "engine/world/BG"
import { useNodesModel } from "../use-nodes-model"
import { goToIdleState, type ViewModel, type ViewModelParams, type ViewState } from "./interface"
import { useViewIdleModel } from "./use-view-idle-model"
import { useViewPanningModel } from "./use-view-panning-model"
import { useViewResizingModel } from "./use-view-resizing-mode"

export const useViewModel = (resizerModel: ResizeTransformServiceReturn) => {
  const rootLayerRef = useRef<Background | null>(null)
  const getLayer = () => rootLayerRef.current as Background

  const nodesModel = useNodesModel({ getLayer })
  const [viewState, setViewState] = useState<ViewState>(goToIdleState())

  console.log(viewState)

  const params: ViewModelParams = {
    setViewState,
    resizerModel,
    nodesModel,
    getLayer,
  }

  const viewIdleModel = useViewIdleModel(params)
  const viewPanningModel = useViewPanningModel(params)
  const viewResizingModel = useViewResizingModel(params)

  let state: ViewModel

  switch (viewState.type) {
    case "idle": state = viewIdleModel(); break
    case "panning": state = viewPanningModel(); break
    case "resizing": state = viewResizingModel(); break
  }

  return {
    ...state,
    rootLayerRef,
  }
}