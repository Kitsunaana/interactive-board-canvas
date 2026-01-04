import { context } from "@/shared/lib/initial-canvas.ts";
import type { Point } from "@/shared/type/shared.ts";
import type { Sticker } from "../../../domain/sticker.ts";
import { CONFIG } from "./config.ts";

export const drawSmoothPath = (points: Point[], offsetX: number, offsetY: number) => {
  if (points.length < 3) return

  context.beginPath()

  const pointsWithOffset = points.map((point) => ({
    x: point.x + offsetX,
    y: point.y + offsetY,
  }))

  const allPoints = [...pointsWithOffset, pointsWithOffset[0], pointsWithOffset[1]]
  const penultimatePoint = allPoints[allPoints.length - 2]
  const firstPoint = allPoints[0]

  context.moveTo(firstPoint.x, firstPoint.y)

  for (let i = 1; i < allPoints.length - 2; i++) {
    const xc = (allPoints[i].x + allPoints[i + 1].x) / 2
    const yc = (allPoints[i].y + allPoints[i + 1].y) / 2

    context.quadraticCurveTo(allPoints[i].x, allPoints[i].y, xc, yc)
  }

  context.quadraticCurveTo(penultimatePoint.x, penultimatePoint.y, firstPoint.x, firstPoint.y)
}

export const drawSmoothWobblyLine = (points: Point[]) => {
  if (points.length < 2) return

  context.beginPath()
  context.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2
    const yc = (points[i].y + points[i + 1].y) / 2

    context.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
  }

  if (points.length > 1) {
    context.quadraticCurveTo(
      points[points.length - 2].x,
      points[points.length - 2].y,
      points[points.length - 1].x,
      points[points.length - 1].y
    )
  }

  context.stroke()
}

export const drawSticker = {
  variant: {
    default: (rect: Sticker & { variant: "default" }) => {
      context.save()
      context.shadowColor = 'rgba(0, 0, 0, 0.2)'
      context.shadowOffsetX = 2
      context.shadowOffsetY = 2
      context.shadowBlur = 11

      context.fillStyle = '#4f46e5'

      context.beginPath()
      context.fillStyle = "#fff8ac"
      context.rect(rect.x, rect.y, rect.width, rect.height)
      context.fill()
      context.restore()
    },

    sketch: (rect: Sticker & { variant: "sketch" }) => {
      context.save()
      const mainOffset = rect.layerOffsets[0]

      context.lineWidth = 1
      context.strokeStyle = rect.strokeColor
      context.globalAlpha = CONFIG.hachureOpacity

      if (rect.hachureFill && rect.hachureLines) {
        context.save()

        drawSmoothPath(rect.outlines[0], mainOffset.x, mainOffset.y)
        context.clip()
        rect.hachureLines.forEach(drawSmoothWobblyLine)

        context.restore();
      }

      rect.outlines.forEach((outline, index) => {
        const offset = rect.layerOffsets[index]
        context.globalAlpha = CONFIG.baseOpacity * (1 - index * 0.15)
        context.lineWidth = 1.2
        context.lineCap = 'round'
        context.lineJoin = 'round'

        drawSmoothPath(outline, offset.x, offset.y)
        context.stroke()
      })

      context.restore()
    }
  }
}