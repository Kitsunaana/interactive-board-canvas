import { getRandFromId } from "@/shared/lib/seed.ts";
import type { Point, Rect } from "@/shared/type/shared.ts";
import * as _ from "lodash"
import type { Circle, Rectangle } from "../domain/_shape.ts";
import type { Camera } from "../modules/_camera/index.ts";
import {
  generateHachureLines,
  generateLayerOffsets,
  generateSketchyOutline,
  getEllipseBasePoints,
  getRectangleBasePoints
} from "../ui/sketch/generate-v2.ts";
import { CONFIG } from "../ui/sketch/config.ts";

export const generateSketchProps = <T extends Rect & { id: string }>({ rect, basePoints }: {
  basePoints: Point[]
  rect: T
}) => {
  const rand = getRandFromId(rect.id)

  const outlines = _.times(CONFIG.layers).map(() => generateSketchyOutline({ basePoints, rand }))

  const layerOffsets = generateLayerOffsets({ rand })
  const hachureLines = generateHachureLines({
    outlinePoints: outlines[0],
    offsetX: layerOffsets[0].x,
    offsetY: layerOffsets[0].y,
    rand,
  })

  return {
    hachureLines,
    layerOffsets,
    outlines,
  }
}

export const generateRectangleSketchProps = (shape: Rectangle) => ({
  hachureFill: true,
  strokeColor: '#8b5cf6',
  ...generateSketchProps({
    basePoints: getRectangleBasePoints(shape.x, shape.y, shape.width, shape.height),
    rect: shape
  })
})

export const generateEllipseSketchProps = (shape: Circle) => {
  const radiusY = shape.height / 2
  const radiusX = shape.width / 2

  return {
    hachureFill: true,
    strokeColor: '#df3182ff',
    ...generateSketchProps({
      basePoints: getEllipseBasePoints(shape.x + radiusX, shape.y + radiusY, radiusX, radiusY),
      rect: shape
    })
  }
}


export const PADDING = 7
export const BASE_RADIUS = 5
export const SCALE_POWER = 0.75
export const BASE_LINE_WIDTH = 0.45

export const getResizeHandlersProperties = ({ rect, camera }: { camera: Camera, rect: Rect }) => [
  {
    strokeWidth: BASE_LINE_WIDTH / Math.pow(camera.scale, SCALE_POWER),
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x - PADDING,
    y: rect.y - PADDING,
  },
  {
    strokeWidth: BASE_LINE_WIDTH / Math.pow(camera.scale, SCALE_POWER),
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x + rect.width + PADDING,
    y: rect.y - PADDING,
  },
  {
    strokeWidth: BASE_LINE_WIDTH / Math.pow(camera.scale, SCALE_POWER),
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x + rect.width + PADDING,
    y: rect.y + rect.height + PADDING,
  },
  {
    strokeWidth: BASE_LINE_WIDTH / Math.pow(camera.scale, SCALE_POWER),
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x - PADDING,
    y: rect.y + rect.height + PADDING,
  },
]