import type { RectangleGeometry } from "../../model/types"

export const getEllipleBasePoints = (geometry: RectangleGeometry, segments = 60) => {
  const { x, y, height, width } = geometry

  const rx = width / 2
  const ry = height / 2
  const cx = x + rx
  const cy = y + ry

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

export const getRectangleBasePoints = (geometry: RectangleGeometry, samples = 36) => {
  const { x, y, height: h, width: w } = geometry

  const points = []
  const perSide = Math.floor(samples / 4)

  for (let i = 0; i <= perSide; i++) points.push({ x: x + w * i / perSide, y })

  for (let i = 1; i < perSide; i++) points.push({ x: x + w, y: y + h * i / perSide })

  for (let i = perSide; i >= 0; i--) points.push({ x: x + w * i / perSide, y: y + h })

  for (let i = perSide - 1; i > 0; i--) points.push({ x: x, y: y + h * i / perSide })

  return points
}