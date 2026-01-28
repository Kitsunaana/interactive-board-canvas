import { toRGB } from "@/shared/lib/color"
import { left, right } from "@/shared/lib/either"
import { initialCanvas } from "@/shared/lib/initial-canvas"
import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point"
import { isNotNull, isNotUndefined } from "@/shared/lib/utils"
import type { Point, Rect } from "@/shared/type/shared"
import * as _ from "lodash"
import type { Bound } from "../../domain/selection-area"
import type { Corner } from "../../domain/selection-area/_types"
import type { ResizeCorner } from "../../view-model/shape-sketch"
import type { Camera } from "../camera"
import { CANVAS_COLOR_ID, ROTATE_HANDLER_COLOR_ID } from "./_ui"
import type { Shape } from "@/entities/shape/model/types"

export type HitCanvas = {
  type: "canvas"
}

export type HitShape = {
  type: "shape"
  shapeId: string
}

export type HitBound = {
  type: "bound"
  bound: Bound
}

export type HitCorner = {
  type: "corner"
  corner: Corner
}

export type HitRotateHandler = {
  type: "rotate-handler"
}

export type HitTarget =
  | HitRotateHandler
  | HitCanvas
  | HitShape
  | HitBound
  | HitCorner


export type BoundLinesColor = Record<Bound, string>
export type CornerLinesColor = Record<Corner, string>

export type SelectionBoundsToPick = {
  linesColor: BoundLinesColor
  bounds: Rect[]
  area: Rect
}

export type ResizeHandlersPropertiesToPick = {
  resizeHandlers: ResizeCorner[]
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
    return right({ type: "canvas" } as HitCanvas)
  }

  return left(null)
}

export const isPickedRotateHandler = (colorId: string) => {
  if (colorId === ROTATE_HANDLER_COLOR_ID) {
    return right({ type: "rotate-handler" } as HitRotateHandler)
  }

  return left(null)
}

export const isPickedBound = (colorId: string, selectionBounds: SelectionBoundsToPick | null) => {
  if (isNotNull(selectionBounds)) {
    const pickedBound = _.find(_.entries(selectionBounds.linesColor), (entry) => entry[1] === colorId) as undefined | [
      bound: Bound, colorId: string
    ]

    if (isNotUndefined(pickedBound)) {
      return right({
        bound: pickedBound[0],
        type: "bound",
      } as HitBound)
    }
  }

  return left(null)
}

export const isPickedCorner = (colorId: string, resizeHandlers: ResizeHandlersPropertiesToPick | null) => {
  if (isNotNull(resizeHandlers)) {
    const pickedCorner = _.find(_.entries(resizeHandlers.linesColor), (entry) => entry[1] === colorId) as undefined | [
      corner: Corner, colorId: string
    ]

    if (isNotUndefined(pickedCorner)) {
      return right({
        type: "corner",
        corner: pickedCorner[0],
      } as HitCorner)
    }
  }

  return left(null)
}

export const isPickedShape = (colorId: string, shapes: Shape[]) => {
  const shape = shapes.find((node) => node.colorId === colorId)
  if (isNotUndefined(shape)) return right({
    type: "shape",
    shapeId: shape.id,
  } as HitShape)

  return left(null)
}

export const createFormatterFoundNode = ({ colorId, event, point }: {
  event: PointerEvent
  colorId: string
  point: Point
}) => (node: HitTarget) => ({ colorId, point, event, node, })