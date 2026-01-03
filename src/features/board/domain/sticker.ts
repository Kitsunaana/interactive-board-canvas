import {
  generateHachureLines,
  generateLayerOffsets,
  generateSketchyOutline,
  getRectBasePoints
} from "../ui/sketch/sticker/generate.ts";
import {CONFIG} from "../ui/sketch/sticker/persist.ts";
import {times} from "lodash";
import type {Point, Rect} from "../../../shared/type/shared.ts";
import type {Camera} from "./camera.ts";
import type {BaseNode} from "./node.ts";

export type StickerSketchVariant = {
  variant: "sketch"

  hachureLines: Array<Point[]>
  outlines: Array<Point[]>
  layerOffsets: Point[]
  hachureFill: boolean
  strokeColor: string
}

export type StickerDefaultVariant = {
  variant: "default"
}

export type StickerVariants = StickerSketchVariant | StickerDefaultVariant

export type Sticker = BaseNode & StickerVariants & {
  type: "sticker"

  width: number
  height: number
  variant: "sketch" | "default"
}

export type StickerToView = Sticker & {
  isSelected: boolean
}

export const PADDING = 7

export const BASE_RADIUS = 5
export const SCALE_POWER = 0.75

export type ActiveBoxDotsParams = {
  camera: Camera
  rect: Rect
}

export const generateNodeSketchProps = (node: Rect) => {
  const points = getRectBasePoints(node.x, node.y, node.width, node.height)
  const outlines = times(CONFIG.layers).map((index) => generateSketchyOutline(points, index))

  const layerOffsets = generateLayerOffsets(0)
  const hachureLines = generateHachureLines({
    outlinePoints: outlines[0],
    offsetX: layerOffsets[0].x,
    offsetY: layerOffsets[0].y
  })

  return {
    outlines,
    layerOffsets,
    hachureFill: true,
    strokeColor: '#8b5cf6',
    hachureLines: hachureLines,
  }
}

export const getActiveBoxDots = ({ rect, camera }: ActiveBoxDotsParams) => [
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x - PADDING,
    y: rect.y - PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x + rect.width + PADDING,
    y: rect.y - PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x + rect.width + PADDING,
    y: rect.y + rect.height + PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x - PADDING,
    y: rect.y + rect.height + PADDING,
  },
]