import type { Point } from "@/shared/type/shared.ts";
import { times } from "lodash";
import { CONFIG } from "./config";

export const generateWobblyLinePoints = ({ x1, y1, x2, y2, rand, }: {
  rand: () => number
  x1: number
  y1: number
  x2: number
  y2: number
}) => {
  const roughness = CONFIG.hachureRoughness
  const segments = 12
  const points = []

  points.push({ x: x1, y: y1 })

  for (let segment = 1; segment < segments; segment++) {
    const t = segment / segments

    let x = x1 + (x2 - x1) * t
    let y = y1 + (y2 - y1) * t

    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy)

    if (len > 0) {
      const nx = -dy / len
      const ny = dx / len

      x += nx * (rand() - 0.5) * roughness * 2
      y += ny * (rand() - 0.5) * roughness * 2
    }

    x += (rand() - 0.5) * roughness * 0.8
    y += (rand() - 0.5) * roughness * 0.8

    points.push({ x, y })
  }

  points.push({ x: x2, y: y2 })

  return points
}

export const generateHachureLines = ({ rand, outlinePoints, offsetX = 0, offsetY = 0 }: {
  outlinePoints: Point[]
  rand: () => number
  offsetX: number
  offsetY: number
}) => {
  const { hachureAngle, hachureGap, hachureLayers } = CONFIG
  const angleRad = (hachureAngle * Math.PI) / 180

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  outlinePoints.forEach((point) => {
    const x = point.x + offsetX
    const y = point.y + offsetY

    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  })

  minX -= 20
  maxX += 20
  minY -= 20
  maxY += 20

  const width = maxX - minX
  const height = maxY - minY
  const diagonal = Math.hypot(width, height) * 1.5

  const dx = Math.cos(angleRad) * diagonal
  const dy = Math.sin(angleRad) * diagonal
  const perpDx = -Math.sin(angleRad) * hachureGap
  const perpDy = Math.cos(angleRad) * hachureGap

  const steps = Math.ceil(Math.hypot(width, height) / hachureGap) + 4

  const allLines = []

  for (let layer = 0; layer < hachureLayers; layer++) {
    const offset = layer * (hachureGap / hachureLayers)

    for (let index = -steps; index <= steps; index++) {
      const startX = minX + perpDx * (index + offset / hachureGap)
      const startY = minY + perpDy * (index + offset / hachureGap)

      const linePoints = generateWobblyLinePoints({
        x2: startX + dx,
        y2: startY + dy,
        x1: startX,
        y1: startY,
        rand,
      })

      allLines.push(linePoints)
    }
  }

  return allLines
}

export const generateSketchyOutline = ({ basePoints, rand }: {
  basePoints: Point[]
  rand: () => number
}) => {
  return basePoints.map((point) => {
    return {
      x: point.x + (rand() - 0.5) * CONFIG.roughness,
      y: point.y + (rand() - 0.5) * CONFIG.roughness * 0.6,
    }
  })
}

export const getRectangleBasePoints = (x: number, y: number, w: number, h: number, samples: number = 36) => {
  const points = []
  const perSide = Math.floor(samples / 4)

  for (let i = 0; i <= perSide; i++) points.push({ x: x + w * i / perSide, y })

  for (let i = 1; i < perSide; i++) points.push({ x: x + w, y: y + h * i / perSide })

  for (let i = perSide; i >= 0; i--) points.push({ x: x + w * i / perSide, y: y + h })

  for (let i = perSide - 1; i > 0; i--) points.push({ x: x, y: y + h * i / perSide })

  return points
}

export const getEllipseBasePoints = (cx: number, cy: number, rx: number, ry: number, segments: number = 60) => {
  const points = []

  for (let i = 0; i < segments; i++) {
    const angle = i / segments * Math.PI * 2

    points.push({
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    })
  }

  return points
}

export const generateLayerOffsets = ({ rand }: { rand: () => number }) => {
  return times(CONFIG.layers).map(() => {
    return {
      x: (rand() - 0.5) * CONFIG.maxOffset,
      y: (rand() - 0.5) * CONFIG.maxOffset,
    }
  })
}
