import type { Camera, Point, Rect } from "./type"

export const screenToCanvas = ({ point, camera }: { point: Point, camera: Camera }) => {
  return {
    x: (point.x - camera.x) / camera.scale,
    y: (point.y - camera.y) / camera.scale,
  }
}

export const isRectIntersection = ({ camera, rect, point }: {
  rect: Rect
  point: Point
  camera: Camera
}) => {
  const worldPosition = screenToCanvas({ point, camera })

  return (
    worldPosition.x >= rect.x && worldPosition.x <= rect.x + rect.width &&
    worldPosition.y >= rect.y && worldPosition.y <= rect.y + rect.height
  )
}