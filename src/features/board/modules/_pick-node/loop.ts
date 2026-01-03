import type { Sticker } from "../../domain/sticker"
import type { Camera } from "../_camera"

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