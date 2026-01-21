import { generateSketchProps, getEllipseBasePoints, getRectangleBasePoints } from "@/shared/lib/sketch";
import type { Rect } from "@/shared/type/shared.ts";
import type { Corner } from "../domain/selection-area";
import type { Circle, Rectangle } from "../domain/shape.ts";
import type { Camera } from "../modules/camera/index.ts";

export const generateRectangleSketchProps = (shape: Rectangle) => {
  return {
    hachureFill: true,
    strokeColor: '#8b5cf6',
    ...generateSketchProps({
      basePoints: getRectangleBasePoints(shape),
      rect: shape
    })
  }
}

export const generateEllipseSketchProps = (shape: Circle) => {
  const radiusY = shape.height / 2
  const radiusX = shape.width / 2

  const rect: Rect = {
    x: shape.x + radiusX,
    y: shape.y + radiusY,
    height: radiusY,
    width: radiusX,
  }

  return {
    hachureFill: true,
    strokeColor: '#df3182ff',
    ...generateSketchProps({
      basePoints: getEllipseBasePoints(rect),
      rect: shape
    })
  }
}


export const PADDING = 7
export const BASE_RADIUS = 5
export const SCALE_POWER = 0.75
export const BASE_LINE_WIDTH = 0.45

export type ResizeHandler = {
  strokeWidth: number
  radius: number
  corner: Corner
  x: number
  y: number
}

export const getResizeHandlersPositions = ({ rect, camera, radius = BASE_RADIUS }: {
  radius?: number
  camera: Camera
  rect: Rect
}): ResizeHandler[] => [
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