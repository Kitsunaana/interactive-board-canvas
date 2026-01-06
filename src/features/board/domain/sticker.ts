import { getRandFromId } from "@/shared/lib/seed.ts";
import type { Point, Rect } from "@/shared/type/shared.ts";
import { times } from "lodash";
import type { Camera } from "../modules/_camera";
import {
  generateHachureLines,
  generateLayerOffsets,
  generateSketchyOutline,
  getRectBasePoints
} from "../ui/sketch/generate-v2.ts";
import { CONFIG } from "../ui/sketch/sticker/config.ts";
import type { BaseNode } from "./node.ts";

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

export const isSticker = (candidate: object & { type: string }): candidate is Sticker => candidate.type === "sticker"

export const PADDING = 7

export const BASE_RADIUS = 5
export const SCALE_POWER = 0.75

export const generateRectSketchProps = ({ id, ...rect }: Rect & { id: string }) => {
  const rand = getRandFromId(id)

  const basePoints = getRectBasePoints(rect.x, rect.y, rect.width, rect.height)
  const outlines = times(CONFIG.layers).map(() => generateSketchyOutline({
    basePoints,
    rand,
  }))

  const layerOffsets = generateLayerOffsets({ rand })
  const hachureLines = generateHachureLines({
    outlinePoints: outlines[0],
    offsetX: layerOffsets[0].x,
    offsetY: layerOffsets[0].y,
    rand,
  })

  return {
    outlines,
    layerOffsets,
    hachureFill: true,
    strokeColor: '#8b5cf6',
    hachureLines: hachureLines,
  }
}

export const getActiveBoxDots = ({ rect, camera }: {
  camera: Camera
  rect: Rect
}) => [
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