import type { EventObject } from "engine/behaviors/EventBehavior"
import { goToPanningState, goToResizingState, type ViewModel, type ViewModelParams } from "./interface"
import type { SimObject } from "engine/core/SimObject"
import type { SelectParams } from "engine/core/SelectionManager"
import type { Shape } from "engine/core/Shape"
import { cameraModel, contextModel } from "../instances"
import { KeyboardMangaer } from "src/keyboard-manager"
import { getPointFromEvent } from "engine/shared/point"

export const useViewIdleModel = ({ nodesModel, resizerModel, getLayer, setViewState }: ViewModelParams) => {
  return (): ViewModel => {

    const getParamsToSelection = (event: EventObject<MouseEvent, SimObject>) => ({
      onSelect: resizerModel.selectNodes,
      target: event.target as Shape,
      targetMode: event.evt.ctrlKey,
      multiselectMode: event.evt.shiftKey,
    } satisfies SelectParams)

    return {
      resizer: {
        handlers: [...resizerModel.handlers.edges, ...resizerModel.handlers.corners].map((handler) => {
          return {
            ...handler,
            onPointerDown: (event) => {
              resizerModel.startTransform(event)
              setViewState(goToResizingState())
            }
          }
        }),
      },

      nodes: nodesModel.mapShapes(nodesModel.nodes, (node) => {
        return {
          ...node,
          onClick: (event) => {
            contextModel.layer = getLayer()
            contextModel.click(getParamsToSelection(event))
          },
          onDblclick: (event) => {
            contextModel.layer = getLayer()
            contextModel.dblclick(getParamsToSelection(event))
          },
          onPointerUp: (event) => {
            event.stopPropagation()
          }
        }
      }),
      layer: {
        onPointerDown: (event) => {
          const isCenterMouseKey = event.evt.button === 1
          const isSpacePressed = KeyboardMangaer.KEY_PRESSED_MAP.get(" ")

          if (isCenterMouseKey || isSpacePressed) {
            cameraModel.handleStart(getPointFromEvent(event.evt))
            setViewState(goToPanningState())
          }
        },

        onPointerUp: () => {
          contextModel.contextExit()
        },

        render: () => {
          const layer = getLayer()

          cameraModel.update()
          layer.offset.copyFrom(cameraModel.position)
        }
      },
      stage: {
        onWheel: (event) => {
          cameraModel.handleChangeZoom(getPointFromEvent(event), event.deltaY)
          const layer = getLayer()

          layer.offset = cameraModel.position
          layer.zoom = cameraModel.zoom
        },
      },
    }
  }
}