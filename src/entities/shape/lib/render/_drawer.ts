import { match } from "@/shared/lib/match"
import { drawSketchShape } from "@/shared/lib/sketch/draw-v2"
import type { Ellipse, Rectangle, ShapeToView, WithSketch } from "../../model/types"
import { CacheBitmapShape, getShapeBitmap } from "./_get-cached-shape"
import { isNotUndefined } from "@/shared/lib/utils"

export const drawDefaultEllipse = (context: CanvasRenderingContext2D, ellipse: Ellipse) => {
  const radiusX = ellipse.width / 2
  const radiusY = ellipse.height / 2

  context.save()

  context.translate(ellipse.x + radiusX, ellipse.y + radiusY)

  context.shadowColor = 'rgba(0, 0, 0, 0.2)'
  context.shadowOffsetX = 2
  context.shadowOffsetY = 2
  context.shadowBlur = 11

  context.beginPath()
  context.ellipse(ellipse.x + radiusX, ellipse.y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2)
  context.fillStyle = "#fff8ac"
  context.fill()

  context.restore()
}

export const drawSketchEllipse = (context: CanvasRenderingContext2D, ellipse: WithSketch<Ellipse> & { sketch: true }) => {
  drawSketchShape(context, {
    hachureLines: ellipse.hachureLines,
    layerOffsets: ellipse.layerOffsets,
    strokeColor: ellipse.strokeColor,
    outlines: ellipse.outlines,
    hachureFill: true,
  })
}

export const drawDefaultRectangle = (context: CanvasRenderingContext2D, rectangle: Rectangle) => {
  context.save()

  context.fillStyle = "#fff8ac"

  context.translate(rectangle.x + rectangle.width / 2, rectangle.y + rectangle.height / 2)

  context.shadowColor = 'rgba(0, 0, 0, 0.2)'
  context.shadowOffsetX = 2
  context.shadowOffsetY = 2
  context.shadowBlur = 11

  context.rotate(0)
  context.beginPath()
  context.rect(-rectangle.width / 2, -rectangle.height / 2, rectangle.width, rectangle.height)
  context.closePath()
  context.fill()

  context.restore()
}


export const drawSketchRectangle = (context: CanvasRenderingContext2D, rectangle: WithSketch<Rectangle> & { sketch: true }) => {
  drawSketchShape(context, {
    hachureLines: rectangle.hachureLines,
    layerOffsets: rectangle.layerOffsets,
    strokeColor: rectangle.strokeColor,
    outlines: rectangle.outlines,
    hachureFill: true,
  })
}

export const drawSketchShapeToBitmap = (context: CanvasRenderingContext2D, shape: ShapeToView & { sketch: true }) => {
  return match(shape, {
    ellipse: (shape) => drawSketchEllipse(context, shape),
    rectangle: (shape) => drawSketchRectangle(context, shape),

    rhombus: () => () => { },
    arrow: () => () => { },
    image: () => () => { },
    line: () => () => { },
    path: () => () => { },
    text: () => () => { },
  })
}

export const drawShape = (context: CanvasRenderingContext2D, shape: ShapeToView) => {
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  return match(shape, {
    ellipse: (shape) => {
      getShapeBitmap(shape)

      const bitmap = CacheBitmapShape.get(shape.id)

      if (isNotUndefined(bitmap)) {

        context.drawImage(bitmap, shape.x, shape.y, shape.width, shape.height)
      }

    },
    rectangle: (shape) => shape.sketch ? drawSketchRectangle(context, shape) : drawDefaultRectangle(context, shape),

    rhombus: () => () => { },
    arrow: () => () => { },
    image: () => () => { },
    line: () => () => { },
    path: () => () => { },
    text: () => () => { },
  })
}