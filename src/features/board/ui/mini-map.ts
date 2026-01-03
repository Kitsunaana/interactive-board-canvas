import type { ObservedValueOf } from "rxjs"
import type { getMiniMapRenderLoop } from "../modules/_mini-map/_stream"

export type SubscribeToMiniMapRenderLoopParams = ObservedValueOf<
  ReturnType<typeof getMiniMapRenderLoop>
>

export const subscribeToMiniMapRenderLoop = ({ context, ...params }: SubscribeToMiniMapRenderLoopParams) => {
  context.save()
  context.clearRect(0, 0, params.canvasSizes.width, params.canvasSizes.height)

  renderMiniMap({ ...params, context })

  context.restore()
}

export const renderMiniMap = (params: SubscribeToMiniMapRenderLoopParams & {
  context: CanvasRenderingContext2D
}) => {
  const { 
    miniMapCameraRect, 
    unscaledNodes,
    miniMapSizes, 
    unscaleMap, 
    context, 
  } = params

  context.beginPath()
  context.fillStyle = "white"
  context.rect(0, 0, miniMapSizes.width, miniMapSizes.height)
  context.closePath()
  context.fill()

  const scale = 1 /  unscaleMap
  context.scale(scale, scale)
  
  unscaledNodes.forEach(({ x, y, width, height }) => {
    context.beginPath()
    context.fillStyle = "#ffe870"
    context.rect(x, y, width, height)
    context.fill()
  })

  context.beginPath()
  context.fillStyle = "rgba(0, 0, 0, 0.3)"

  context.rect(
    miniMapCameraRect.x,
    miniMapCameraRect.y,
    miniMapCameraRect.width,
    miniMapCameraRect.height,
  )

  context.fill()
}