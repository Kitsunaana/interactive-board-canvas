import { initialCanvas } from "@/shared/lib/initial-canvas"
import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point"
import type { Node } from "../../domain/node"
import type { Sticker } from "../../domain/sticker"
import type { Camera } from "../_camera"

export const [context] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "helper",
})

export const toRGB = (red: number, green: number, blue: number) => {
  return `rgb(${red},${green},${blue})`
}

export const generateRandomColor = () => {
  const red = Math.trunc(Math.random() * 255)
  const green = Math.trunc(Math.random() * 255)
  const blue = Math.trunc(Math.random() * 255)

  return toRGB(red, green, blue)
}

export const getPickedColor = ({ camera, context, event }: {
  context: CanvasRenderingContext2D
  event: PointerEvent
  camera: Camera
}) => {
  const worldPoint = getPointFromEvent(event)
  const pointOnScreen = screenToCanvas({ camera, point: worldPoint })

  const pixelData = context.getImageData(worldPoint.x, worldPoint.y, 1, 1)
  const [red, green, blue] = pixelData.data
  const pickedColorId = toRGB(red, green, blue)

  return {
    colorId: pickedColorId,
    point: pointOnScreen,
  }
}

export const findNodeByColorId = ({ nodes, event, camera, context }: {
  context: CanvasRenderingContext2D
  event: PointerEvent
  camera: Camera
  nodes: Node[]
}) => {
  const { colorId, point } = getPickedColor({ context, camera, event })
  const node = nodes.find((node) => node.colorId === colorId) ?? {
    colorId: generateRandomColor(),
    type: "grid",
    id: "grid",
  }

  return {
    colorId,
    point,
    event,
    node,
  }
}

export const renderHelperNodes = ({ context, camera, stickers }: {
  context: CanvasRenderingContext2D
  stickers: Sticker[]
  camera: Camera
}) => {
  context.save()

  context.clearRect(0, 0, window.innerWidth / 2, window.innerHeight)

  context.translate(camera.x, camera.y)
  context.scale(camera.scale, camera.scale)

  stickers.forEach(({ colorId, height, width, x, y }) => {
    context.save()
    context.beginPath()
    context.fillStyle = colorId
    context.rect(x, y, width, height)
    context.fill()
    context.restore()
  })

  context.restore()
}
