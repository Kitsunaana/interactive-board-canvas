import { generateRandomColor } from "@/shared/lib/color"
import { context } from "@/shared/lib/initial-canvas"
import * as ShapeDomain from "./shapes.types"
import { getBoundingBox, getRotatedEllipseAABB } from "./test"

const rectangle: ShapeDomain.Rectangle = {
  colorId: generateRandomColor(),
  id: "1",
  kind: "shape",
  sketch: false,
  style: {} as any,
  geometry: {
    type: "rect",
    x: 500,
    y: 200,
    width: 100,
    height: 200,
  },
  transform: {
    rotate: 1.5,
  }
}

const testRectangle = (rectangle: ShapeDomain.Rectangle) => {
  context.save()
  context.beginPath()
  context.translate(rectangle.geometry.x + rectangle.geometry.width / 2, rectangle.geometry.y + rectangle.geometry.height / 2)
  context.rotate(rectangle.transform.rotate)
  context.rect(-rectangle.geometry.width / 2, -rectangle.geometry.height / 2, rectangle.geometry.width, rectangle.geometry.height)
  context.closePath()
  context.globalAlpha = 0.2
  context.fill()
  context.restore()

  const boundingBox = getBoundingBox(rectangle)

  context.save()
  context.strokeStyle = "red"
  context.beginPath()
  context.rect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height)
  context.closePath()
  context.stroke()
  context.restore()
}

const ellipse: ShapeDomain.Ellipse = {
  colorId: generateRandomColor(),
  id: "1",
  kind: "shape",
  sketch: false,
  style: {} as any,
  geometry: {
    type: "rect",
    x: 500,
    y: 200,
    width: 100,
    height: 100,
  },
  transform: {
    rotate: 1,
  }
}

const testEllipse = (ellipse: ShapeDomain.Ellipse) => {
  context.save()
  context.beginPath()

  context.translate(ellipse.geometry.x + ellipse.geometry.width / 2, ellipse.geometry.y + ellipse.geometry.height / 2)
  context.rotate(ellipse.transform.rotate)

  context.ellipse(
    0,
    0,
    ellipse.geometry.width / 2,
    ellipse.geometry.height / 2,
    0,
    0,
    Math.PI * 2
  )

  context.closePath()
  context.fill()
  context.restore()

  const boundingBox = getRotatedEllipseAABB(ellipse.geometry, ellipse.transform.rotate)

  context.save()
  context.strokeStyle = "red"
  context.beginPath()
  context.rect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height)
  context.closePath()
  context.stroke()
  context.restore()
}
