import type {PointData} from "../maths";

export function drawOriginPoint(context: CanvasRenderingContext2D, point: PointData, caption: string) {
  context.beginPath()
  context.font = "14px Roboto"
  context.textAlign = "center"
  context.textBaseline = "bottom"
  context.fillText(caption, point.x, point.y - 5)
  context.arc(point.x, point.y, 5, 0, Math.PI * 2)
  context.stroke()
  context.beginPath()
  context.arc(point.x, point.y, 2, 0, Math.PI * 2)
  context.fill()
}
