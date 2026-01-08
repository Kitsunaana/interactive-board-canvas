import type { ShapeToView } from "@/features/board/domain/dto.ts";
import { left, matchEither, right } from "@/shared/lib/either.ts";
import { context } from "@/shared/lib/initial-canvas.ts";
import { match } from "@/shared/lib/match.ts";
import type { Point } from "@/shared/type/shared.ts";
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

export const getShapeDrawer = (shape: ShapeToView) => {
  match(shape, {
    arrow: () => { },

    circle: (shape) => {
      matchEither(shape.sketch ? right(shape) : left(shape), {
        right: ({ hachureFill, hachureLines, layerOffsets, outlines, strokeColor }) => {
          context.save()

          const mainOffset = layerOffsets[0]

          context.lineWidth = 1
          context.strokeStyle = strokeColor
          context.globalAlpha = CONFIG.hachureOpacity

          if (hachureFill && hachureLines) {
            context.save()
            drawSmoothPath(outlines[0], mainOffset.x, mainOffset.y)
            context.clip()
            hachureLines.forEach(drawSmoothWobblyLine)
            context.restore();
          }

          outlines.forEach((outline, index) => {
            const offset = layerOffsets[index]
            context.globalAlpha = CONFIG.baseOpacity * (1 - index * 0.15)
            context.lineWidth = 1.2
            context.lineCap = 'round'
            context.lineJoin = 'round'

            drawSmoothPath(outline, offset.x, offset.y)
            context.stroke()
          })

          context.restore()
        },
        left: ({ x, y, height, width }) => {
          const radiusX = width / 2
          const radiusY = height / 2

          context.save()

          context.shadowColor = 'rgba(0, 0, 0, 0.2)'
          context.shadowOffsetX = 2
          context.shadowOffsetY = 2
          context.shadowBlur = 11

          context.beginPath()
          context.ellipse(x + radiusX, y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
          context.fillStyle = "#fff8ac"
          context.fill()

          context.restore()
        },
      })
    },

    square: () => { },

    rectangle: (rectangle) => {
      matchEither(rectangle.sketch ? right(rectangle) : left(rectangle), {
        right: ({ strokeColor, layerOffsets, hachureLines, hachureFill, outlines }) => {
          context.save()

          const mainOffset = layerOffsets[0]

          context.lineWidth = 1
          context.strokeStyle = strokeColor
          context.globalAlpha = CONFIG.hachureOpacity

          if (hachureFill && hachureLines) {
            context.save()
            drawSmoothPath(outlines[0], mainOffset.x, mainOffset.y)
            context.clip()
            hachureLines.forEach(drawSmoothWobblyLine)
            context.restore();
          }

          outlines.forEach((outline, index) => {
            const offset = layerOffsets[index]
            context.globalAlpha = CONFIG.baseOpacity * (1 - index * 0.15)
            context.lineWidth = 1.2
            context.lineCap = 'round'
            context.lineJoin = 'round'

            drawSmoothPath(outline, offset.x, offset.y)
            context.stroke()
          })

          context.restore()
        },

        left: ({ x, y, width, height }) => {
          context.save()
          context.shadowColor = 'rgba(0, 0, 0, 0.2)'
          context.shadowOffsetX = 2
          context.shadowOffsetY = 2
          context.shadowBlur = 11

          context.fillStyle = '#4f46e5'

          context.beginPath()
          context.fillStyle = "#fff8ac"
          context.rect(x, y, width, height)
          context.fill()
          context.restore()
        }
      })
    }
  })
}