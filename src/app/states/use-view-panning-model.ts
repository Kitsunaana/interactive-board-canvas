import { getPointFromEvent } from "engine/shared/point"
import { cameraModel } from "../instances"
import { goToIdleState, type ViewModel, type ViewModelParams } from "./interface"

export const useViewPanningModel = ({ nodesModel, resizerModel, getLayer, setViewState }: ViewModelParams) => {
  return (): ViewModel => {
    return {
      resizer: {
        handlers: [...resizerModel.handlers.edges, ...resizerModel.handlers.corners],
      },
      nodes: nodesModel.nodes,
      layer: {
        onPointerMove: (event) => {
          cameraModel.handleMove(getPointFromEvent(event.evt))
          getLayer().offset.copyFrom(cameraModel.position)
        },
        onPointerUp: (event) => {
          cameraModel.handleUp(getPointFromEvent(event.evt))
          setViewState(goToIdleState())
        },
      },
      stage: {
        onPointerLeave: (event) => {
          cameraModel.handleUp(getPointFromEvent(event))
          setViewState(goToIdleState())
        }
      }
    }
  }
}