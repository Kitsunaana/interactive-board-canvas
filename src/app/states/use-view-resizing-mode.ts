import { goToIdleState, type ViewModel, type ViewModelParams } from "./interface"

export const useViewResizingModel = ({ nodesModel, resizerModel, setViewState }: ViewModelParams) => {
  return (): ViewModel => {
    return {
      resizer: {
        handlers: [...resizerModel.handlers.edges, ...resizerModel.handlers.corners],
      },
      nodes: nodesModel.nodes,
      layer: {
        onPointerMove: (event) => {
          resizerModel.processTransform(event)
        },
        onPointerUp: (event) => {
          resizerModel.finishTransform(event)
          setViewState(goToIdleState())
        },
      },

      stage: {}
    }
  }
}
