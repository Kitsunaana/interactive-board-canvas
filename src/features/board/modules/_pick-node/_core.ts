import { generateRandomColor, toRGB } from "@/shared/lib/color"
import { initialCanvas } from "@/shared/lib/initial-canvas"
import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point"
import type { Shape } from "../../domain/dto"
import type { Camera } from "../_camera"

export const [context] = initialCanvas({
  height: window.innerHeight,
  width: window.innerWidth,
  canvasId: "helper",
})

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

export const findNodeByColorId = ({ shapes, event, camera, context }: {
  context: CanvasRenderingContext2D
  event: PointerEvent
  shapes: Shape[]
  camera: Camera
}) => {
  const { colorId, point } = getPickedColor({ context, camera, event })

  const node = shapes.find((node) => node.colorId === colorId) ?? {
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
