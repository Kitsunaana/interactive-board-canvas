import { gridViewCanvas, subscriberToGridMap } from "./grid-map"
import "./index.css"
import { type Sticker } from "./nodes/sticker"
import { ViewModelContext } from "./nodes/system"
import { IdleViewModel } from "./nodes/view-model/idle"
import { context as _context, canvas } from "./setup"

const context = _context as CanvasRenderingContext2D

const pointerPosition = subscriberToGridMap.pointerPosition
const camera = subscriberToGridMap.camera

const toPercentZoom = (scale: number) => {
  return (scale * 100).toFixed(0) + "%"
}

const zoomElement = document.createElement("div")

zoomElement.classList.add("zoom-indicator")
zoomElement.textContent = toPercentZoom(camera.scale)

document.body.appendChild(zoomElement)

const grid = gridViewCanvas

const viewModelContext = new ViewModelContext(IdleViewModel.goToIdle())

console.log(viewModelContext.nodes[0].sticker)

const drawStickers = () => {
  context.save()

  viewModelContext.nodes.forEach((sticker) => {
    sticker.drawSticker(context)
  })

  // if (isDragging) {
  //   const worldPosition = screenToCanvas({
  //     point: pointerPosition,
  //     camera,
  //   })

  //   node.x = worldPosition.x - nodesManager.dragOffset.x
  //   node.y = worldPosition.y - nodesManager.dragOffset.y
  // }

  context.restore()
}

const render = () => {
  if (context === null) return

  requestAnimationFrame(render)
  context.clearRect(0, 0, canvas.width, canvas.height)

  // console.log(subscriberToGridMap.camera)

  context.save()
  context.translate(subscriberToGridMap.camera.x, subscriberToGridMap.camera.y)
  context.scale(subscriberToGridMap.camera.scale, subscriberToGridMap.camera.scale)

  grid.toDrawGrid(context)

  drawStickers()

  context.restore()
}

render()
