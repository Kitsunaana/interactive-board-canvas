import { screenToCanvas } from "../point"
import type { Camera, Level, Point } from "../type"

const BASE_GRID_SIZE = 8
const COLOR = "#dedede"

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

const _getNextLevelMinScale = (level: Level) => {
  return LEVELS[LEVELS.indexOf(level) - 1]?.minScale || level.minScale * 2
}

const _getFadeProgress = (camera: Camera, level: Level) => {
  const nextLevelMinScale = _getNextLevelMinScale(level)
  const fadeRange = nextLevelMinScale - level.minScale

  return Math.min(1, Math.max(0, (camera.scale - level.minScale) / fadeRange))
}

const computeGridProps = ({ camera, level, endWorld, startWorld, fadeProgress }: {
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
  const strokeStyle = COLOR + Math.floor(opacity * 255).toString(16).padStart(2, '0')
  const lineWidth = 1 / camera.scale

  return {
    levelSize: level.size,
    strokeStyle,
    lineWidth,
    startX,
    startY,
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
  const fadeProgress = _getFadeProgress(camera, level)
  if (fadeProgress <= 0) return null

  return computeGridProps({
    fadeProgress,
    startWorld,
    endWorld,
    camera,
    level,
  })
}

type Sizes = {
  height: number
  width: number
}

const startPoint = {
  x: 0,
  y: 0,
}

export const generateGridPropertiesToRender = ({ camera, canvasSizes }: {
  canvasSizes: Sizes
  camera: Camera
}) => {
  const endPoint = {
    y: canvasSizes.height,
    x: canvasSizes.width,
  }

  const startWorld = screenToCanvas({
    point: startPoint,
    camera,
  })

  const endWorld = screenToCanvas({
    point: endPoint,
    camera,
  })

  return LEVELS
    .map((level) => toDrawOneLevel({
      startWorld,
      endWorld,
      camera,
      level,
    }))
    .filter((properties): properties is ReturnType<typeof computeGridProps> => Boolean(properties))
}

export function drawGrid({ context, generatedProperties }: {
  generatedProperties: ReturnType<typeof generateGridPropertiesToRender>
  context: CanvasRenderingContext2D
}) {
  context.save()

  generatedProperties.forEach(({ levelSize, strokeStyle, lineWidth, startX, startY, endX, endY }) => {
    context.strokeStyle = strokeStyle
    context.lineWidth = lineWidth

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