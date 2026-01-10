import { toRGB } from "@/shared/lib/color"
import { left, right } from "@/shared/lib/either"
import { initialCanvas } from "@/shared/lib/initial-canvas"
import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point"
import { isNotNull, isNotUndefined } from "@/shared/lib/utils"
import type { Point, Rect } from "@/shared/type/shared"
import { entries, find } from "lodash"
import type { Shape } from "../../domain"
import type { BoundVariant } from "../../domain/_selection/_selection.type"
import type { Camera } from "../_camera"
import { CANVAS_COLOR_ID } from "./_ui"

export type BoundLinesColor = Record<BoundVariant, string>

export type SelectionBounds = {
  bounds: Rect[]
  area: Rect
}

export type SelectionBoundsToPick = {
  linesColor: BoundLinesColor
  bounds: Rect[]
  area: Rect
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
    const pickedBound = find(
      entries(selectionBounds.linesColor),
      ([_, boundColorId]) => boundColorId === colorId
    ) as [bound: BoundVariant, colorId: string] | undefined

    if (isNotUndefined(pickedBound)) {
      return right({
        id: pickedBound[0],
        type: "bound",
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