import type { Rect } from "@/shared/type/shared.ts";
import type { Camera } from "../modules/_camera/_domain.ts";

const baseLineWidth = 0.45
const scalePower = 0.75
const baseRadius = 5
const padding = 7

export const drawActiveBox = ({ context, rect, camera }: {
  context: CanvasRenderingContext2D
  camera: Camera
  rect: Rect
}) => {
  context.save()
  context.beginPath()
  context.strokeStyle = "#314cd9"
  context.lineWidth = 0.4
  context.moveTo(rect.x - padding, rect.y - padding)
  context.lineTo(rect.x + rect.width + padding, rect.y - padding)
  context.lineTo(rect.x + rect.width + padding, rect.y + rect.height + padding)
  context.lineTo(rect.x - padding, rect.y + rect.height + padding)
  context.lineTo(rect.x - padding, rect.y - padding)
  context.closePath()
  context.stroke()
  context.restore()
  
  // const dotLineWidth = baseLineWidth / Math.pow(camera.scale, scalePower)
  // const dotRadius = baseRadius / Math.pow(camera.scale, scalePower)

  // context.save()
  // context.fillStyle = "#ffffff"
  // context.strokeStyle = "#aaaaaa"

  // activeBoxDots.forEach((dot) => {
  //   context.beginPath()
  //   context.lineWidth = dotLineWidth
  //   context.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2)
  //   context.fill()
  //   context.stroke()
  //   context.closePath()
  // })

  // context.restore()
}