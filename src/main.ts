// import { gridViewCanvas } from "./grid-map"
// import "./index.css"
// import { ViewModelContext } from "./nodes/system"
// import { IdleViewModel } from "./nodes/view-model/idle"
// import { isRectIntersection } from "./point"
// import { context as _context, canvas } from "./setup"
// import type { Point, Rect } from "./type"

// import { canvasCamera } from "./new/camera/model"

// const context = _context as CanvasRenderingContext2D

// const toPercentZoom = (scale: number) => {
//   return (scale * 100).toFixed(0) + "%"
// }

// const zoomElement = document.createElement("div")

// zoomElement.classList.add("zoom-indicator")
// zoomElement.textContent = toPercentZoom(canvasCamera.camera.scale)

// document.body.appendChild(zoomElement)

// const grid = gridViewCanvas

// const viewModelContext = new ViewModelContext(IdleViewModel.goToIdle())

// console.log(viewModelContext.nodes[0].sticker)

// window.addEventListener("click", (event) => {
//   const dots = viewModelContext.nodes[0].sticker.activeBoxDots

//   const imageData = context.getImageData(event.clientX, event.clientY, 1, 1)

//   const point: Point = {
//     x: event.clientX,
//     y: event.clientY,
//   }

//   const [red, green, blue] = imageData.data

//   const foundClickedDot = dots.find(dot => {
//     const rect: Rect = {
//       height: dot.radius * 2,
//       width: dot.radius * 2,
//       x: dot.x - dot.radius,
//       y: dot.y - dot.radius,
//     }

//     const isIntersect = isRectIntersection({
//       camera: canvasCamera.camera,
//       point,
//       rect,
//     })

//     return isIntersect && red === 255 && green === 255 && blue === 255
//   })

//   console.log(foundClickedDot)
// })

// const drawStickers = () => {
//   context.save()

//   viewModelContext.nodes.forEach((sticker) => {
//     sticker.drawSticker(context)
//   })

//   context.restore()
// }

// const render = () => {
//   if (context === null) return

//   requestAnimationFrame(render)
//   context.clearRect(0, 0, canvas.width, canvas.height)

//   context.save()
//   context.translate(canvasCamera.camera.x, canvasCamera.camera.y)
//   context.scale(canvasCamera.camera.scale, canvasCamera.camera.scale)

//   grid.toDrawGrid(context)

//   drawStickers()

//   context.restore()
// }

// render()
