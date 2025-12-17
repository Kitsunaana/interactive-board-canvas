import type { Point } from "../type"
import type { Camera } from "./camera"

export const BASE_GRID_SIZE = 12
export const COLOR = "#e6e6e6"

export type Level = {
  size: number
  minScale: number
}

export type ComputeGridPropsReturn = {
  levelSize: number
  startX: number
  startY: number
  color: string
  width: number
  endX: number
  endY: number
}

export type DrawGridParams = {
  gridProps: ComputeGridPropsReturn[]
  context: CanvasRenderingContext2D
}

export const LEVELS: Array<Level> = [
  { size: BASE_GRID_SIZE, minScale: 2.0 },
  { size: BASE_GRID_SIZE * 2, minScale: 1.0 },
  { size: BASE_GRID_SIZE * 4, minScale: 0.5 },
  { size: BASE_GRID_SIZE * 8, minScale: 0.25 },
  { size: BASE_GRID_SIZE * 16, minScale: 0.125 },
  { size: BASE_GRID_SIZE * 32, minScale: 0.0625 },
  { size: BASE_GRID_SIZE * 64, minScale: 0.03125 },
  { size: BASE_GRID_SIZE * 128, minScale: 0.015625 },
  { size: BASE_GRID_SIZE * 256, minScale: 0.0078125 },
  { size: BASE_GRID_SIZE * 512, minScale: 0.00390625 },
  { size: BASE_GRID_SIZE * 1024, minScale: 0.001953125 },
  { size: BASE_GRID_SIZE * 2048, minScale: 0 },
]

export const getNextLevelMinScale = (level: Level) => {
  return LEVELS[LEVELS.indexOf(level) - 1]?.minScale || level.minScale * 2
}

export const getFadeProgress = (camera: Camera, level: Level) => {
  const nextLevelMinScale = getNextLevelMinScale(level)
  const fadeRange = nextLevelMinScale - level.minScale

  return Math.min(1, Math.max(0, (camera.scale - level.minScale) / fadeRange))
}

export const computeGridProps = ({ camera, level, endWorld, startWorld, fadeProgress }: {
  fadeProgress: number
  startWorld: Point
  endWorld: Point
  camera: Camera
  level: Level
}) => {
  const startX = Math.floor(startWorld.x / level.size) * level.size
  const startY = Math.floor(startWorld.y / level.size) * level.size
  const endX = Math.ceil(endWorld.x / level.size) * level.size
  const endY = Math.ceil(endWorld.y / level.size) * level.size

  const opacity = fadeProgress * 0.5
  const color = COLOR + Math.floor(opacity * 255).toString(16).padStart(2, '0')
  const width = 1 / camera.scale

  return {
    levelSize: level.size,
    startX,
    startY,
    color,
    width,
    endX,
    endY,
  }
}

export const toDrawOneLevel = ({ camera, level, endWorld, startWorld }: {
  startWorld: Point
  endWorld: Point
  camera: Camera
  level: Level
}) => {
  if (camera.scale < level.minScale) return null
  const fadeProgress = getFadeProgress(camera, level)
  if (fadeProgress <= 0) return null

  return computeGridProps({
    fadeProgress,
    startWorld,
    endWorld,
    camera,
    level,
  })
}

export const drawLinesGrid = ({ context, gridProps }: DrawGridParams) => {
  context.save()

  gridProps.forEach(({ levelSize, color, width, startX, startY, endX, endY }) => {
    context.strokeStyle = color
    context.lineWidth = width

    for (let x = startX; x <= endX; x += levelSize) {
      context.beginPath()
      context.moveTo(x, startY)
      context.lineTo(x, endY)
      context.stroke()
    }

    for (let y = startY; y <= endY; y += levelSize) {
      context.beginPath()
      context.moveTo(startX, y)
      context.lineTo(endX, y)
      context.stroke()
    }
  })

  context.restore()
}

export const drawDotsGrid = ({ context, gridProps }: DrawGridParams) => {
  context.save()

  gridProps.forEach(({ levelSize, color, width, startX, startY, endX, endY }) => {
    context.fillStyle = color
    context.lineWidth = width

    for (let x = startX; x <= endX; x += levelSize) {
      for (let y = startY; y <= endY; y += levelSize) {
        context.beginPath()
        context.arc(x, y, width * 2, 0, 2 * Math.PI);
        context.closePath()
        context.fill()
      }
    }
  })

  context.restore()
}

export const gridTypeVariants = {
  lines: drawLinesGrid,
  dots: drawDotsGrid,
}


