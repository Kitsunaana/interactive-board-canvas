import type { Rect } from "@/shared/type/shared.ts";
import type { Corner } from "../domain/selection-area";
import type { Camera } from "../modules/camera/index.ts";

export const PADDING = 7
export const BASE_RADIUS = 5
export const SCALE_POWER = 0.75
export const BASE_LINE_WIDTH = 0.45

export type ResizeCorner = {
  strokeWidth: number
  radius: number
  corner: Corner
  x: number
  y: number
}

export const getResizeCorners = ({ rect, camera, radius = BASE_RADIUS }: {
  radius?: number
  camera: Camera
  rect: Rect
}): ResizeCorner[] => [
    {
      strokeWidth: BASE_LINE_WIDTH / Math.pow(camera.scale, SCALE_POWER),
      radius: radius / Math.pow(camera.scale, SCALE_POWER),
      x: rect.x - PADDING,
      y: rect.y - PADDING,
      corner: "topLeft",
    },
    {
      strokeWidth: BASE_LINE_WIDTH / Math.pow(camera.scale, SCALE_POWER),
      radius: radius / Math.pow(camera.scale, SCALE_POWER),
      x: rect.x + rect.width + PADDING,
      y: rect.y - PADDING,
      corner: "topRight",
    },
    {
      strokeWidth: BASE_LINE_WIDTH / Math.pow(camera.scale, SCALE_POWER),
      radius: radius / Math.pow(camera.scale, SCALE_POWER),
      x: rect.x + rect.width + PADDING,
      y: rect.y + rect.height + PADDING,
      corner: "bottomRight",
    },
    {
      strokeWidth: BASE_LINE_WIDTH / Math.pow(camera.scale, SCALE_POWER),
      radius: radius / Math.pow(camera.scale, SCALE_POWER),
      x: rect.x - PADDING,
      y: rect.y + rect.height + PADDING,
      corner: "bottomLeft",
    },
  ]