import { toRGB } from "@/shared/lib/color"
import { left, right } from "@/shared/lib/either"
import { initialCanvas } from "@/shared/lib/initial-canvas"
import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point"
import { isNotNull, isNotUndefined } from "@/shared/lib/utils"
import type { Point, Rect } from "@/shared/type/shared"
import * as _ from "lodash"
import type { Camera } from "../camera"
import { CANVAS_COLOR_ID } from "./_ui"
import type { Bound } from "../../domain/selection-area"
import type { Shape } from "../../domain/shape"
import type { Corner } from "../../domain/selection-area/_type"
import type { ResizeHandler } from "../../view-model/shape-sketch"

export type BoundLinesColor = Record<Bound, string>

export type CornerLinesColor = Record<Corner, string>

export type SelectionBoundsToPick = {
  linesColor: BoundLinesColor
  bounds: Rect[]
  area: Rect
}

export type ResizeHandlersPropertiesToPick = {
  resizeHandlers: ResizeHandler[]
  linesColor: CornerLinesColor
}

export const [context] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "helper",
})

export const getPickedColor = ({ camera, context, event }: {
  context: CanvasRenderingContext2D
  event: PointerEvent
  camera: Camera
}) => {
  const worldPoint = getPointFromEvent(event)
  const pointOnScreen = screenToCanvas({ camera, point: worldPoint })

  const pixelData = context.getImageData(worldPoint.x, worldPoint.y, 1, 1)
  const [red, green, blue] = pixelData.data
  const pickedColorId = toRGB(red, green, blue)

  return {
    colorId: pickedColorId,
    point: pointOnScreen,
  }
}

export const isPickedCanvas = (colorId: string) => {
  if (colorId === CANVAS_COLOR_ID) {
    return right({
      type: "grid",
      id: "grid",
    } as const)
  }

  return left(null)
}

export const isPickedSelectionBound = (colorId: string, selectionBounds: SelectionBoundsToPick | null) => {
  if (isNotNull(selectionBounds)) {
    const pickedBound = _.find(_.entries(selectionBounds.linesColor), (entry) => entry[1] === colorId) as undefined | [
      bound: Bound, colorId: string
    ]

    if (isNotUndefined(pickedBound)) {
      return right({
        id: pickedBound[0],
        type: "bound",
      } as const)
    }
  }

  return left(null)
}

export const isPickedResizeHandler = (colorId: string, resizeHandlers: ResizeHandlersPropertiesToPick | null) => {
  if (isNotNull(resizeHandlers)) {
    const pickedResizeHandler = _.find(_.entries(resizeHandlers.linesColor), (entry) => entry[1] === colorId) as undefined | [
      corner: Corner, colorId: string
    ]

    if (isNotUndefined(pickedResizeHandler)) {
      return right({
        id: pickedResizeHandler[0],
        type: "corner",
      } as const)
    }
  }

  return left(null)
}

export const isPickedShape = (colorId: string, shapes: Shape[]) => {
  const shape = shapes.find((node) => node.colorId === colorId)
  if (isNotUndefined(shape)) return right(shape)

  return left(null)
}

export const createFormatterFoundNode = ({ colorId, event, point }: {
  event: PointerEvent
  colorId: string
  point: Point
}) => <T>(node: T) => ({ colorId, point, event, node, })