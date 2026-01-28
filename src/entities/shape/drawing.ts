// import { generateRandomColor } from "@/shared/lib/color"
// import { getPointFromEvent } from "@/shared/lib/point"
// import { isNotUndefined } from "@/shared/lib/utils"
// import type { Point, Rect } from "@/shared/type/shared"
// import { nanoid } from "nanoid"
// import * as rx from "rxjs"
// import { getRotatedPolygoneAABB } from "./model/get-bounding-box"
// import { drawSmoothedLine, simplifyLineRDP, smoothLine } from "./model/smooth-line"

// const testShape: ShapeDomain.Pen = {
//   "type": "pen",
//   "kind": "pen",
//   "id": "r4zst064BLUlMArJKwguJ",
//   "colorId": "rgb(76,75,100)",
//   "style": {} as any,
//   "transform": {
//     "rotate": 0,
//     scaleX: 2,
//     scaleY: 2,
//   },
//   "geometry": {
//     "type": "path",
//     "points": [
//       {
//         "x": 267.87626578195875,
//         "y": 399.55571488897743
//       },
//       {
//         "x": 255.02571580233197,
//         "y": 434.5103658525859
//       },
//       {
//         "x": 258.1842286758878,
//         "y": 466.007596182375
//       },
//       {
//         "x": 277.72192468373544,
//         "y": 478.03551687589066
//       },
//       {
//         "x": 310.0928602176903,
//         "y": 473.3108595547381
//       },
//       {
//         "x": 354.2148496005155,
//         "y": 452.26406221738296
//       },
//       {
//         "x": 378.10928468708005,
//         "y": 431.4310535840437
//       },
//       {
//         "x": 395.94801324942176,
//         "y": 402.42439717952396
//       },
//       {
//         "x": 407.85308336092777,
//         "y": 355.9076443877151
//       },
//       {
//         "x": 388.4781285309965,
//         "y": 390.30178812135375
//       },
//       {
//         "x": 378.90949220577716,
//         "y": 421.7084808653337
//       },
//       {
//         "x": 373.0412409658686,
//         "y": 462.0768528663371
//       },
//       {
//         "x": 385.066778694252,
//         "y": 461.82605457711253
//       },
//       {
//         "x": 414.1615444098541,
//         "y": 445.8115447585531
//       },
//       {
//         "x": 445.55961478500103,
//         "y": 412.83384543799923
//       },
//       {
//         "x": 476.3411817981768,
//         "y": 371.9388797534525
//       },
//       {
//         "x": 487.03283376461843,
//         "y": 343.2774159893371
//       },
//       {
//         "x": 452.88265483507655,
//         "y": 415.6312507163757
//       },
//       {
//         "x": 446.2021355329762,
//         "y": 440.2059215128198
//       },
//       {
//         "x": 447.8717273119728,
//         "y": 455.3432085499088
//       },
//       {
//         "x": 454.4455802839666,
//         "y": 466.4235861133185
//       },
//       {
//         "x": 464.001138788813,
//         "y": 467.23861714903234
//       },
//       {
//         "x": 513.5958158466387,
//         "y": 444.44538919640877
//       }
//     ]
//   }
// }

// const DRAW_CONFIG = {
//   strokeColor: "#a243ae",
//   lazyRadius: 25,
//   lineWidth: 10,
//   opacity: 1,
// }

// export const CacheBitmapShape = new Map<string, ImageBitmap>()

// export async function getBitmapFromPathGeometry<Shape extends ShapeDomain.Shape<ShapeDomain.PathGeometry>>(shape: Shape) {
//   const cached = CacheBitmapShape.get(shape.id)
//   if (cached) return cached

//   const aabb = getRotatedPolygoneAABB(shape.geometry.points, shape.transform.rotate)

//   const points = shape.geometry.points.map((point) => ({
//     x: point.x - aabb.minX + DRAW_CONFIG.lineWidth,
//     y: point.y - aabb.minY + DRAW_CONFIG.lineWidth,
//   }))

//   const boundingBox = getAABBSize(getRotatedPolygoneAABB(points, shape.transform.rotate))

//   const bitmap = await createImageBitmap(renderShapeToBitmap(boundingBox, (context) => {
//     context.lineCap = "round"
//     context.lineJoin = "round"

//     renderPenPath(context, points, shape.transform.rotate)
//   }))

//   CacheBitmapShape.set(shape.id, bitmap)
//   return bitmap
// }

// function renderShapeToBitmap(boundingBox: Rect, draw: (context: CanvasRenderingContext2D) => void) {
//   const canvas = document.createElement("canvas")
//   const context = canvas.getContext("2d") as CanvasRenderingContext2D

//   const QUALITY_SCALE = 3

//   canvas.width = (boundingBox.width + DRAW_CONFIG.lineWidth * 2) * QUALITY_SCALE
//   canvas.height = (boundingBox.height + DRAW_CONFIG.lineWidth * 2) * QUALITY_SCALE

//   context.scale(QUALITY_SCALE, QUALITY_SCALE)

//   draw(context)

//   // saveCanvasToFile(canvas)

//   return canvas
// }

// const buildPenPathShape = (points: Point[]): ShapeDomain.Pen => {
//   return {
//     kind: "pen",
//     type: "pen",
//     id: nanoid(),
//     colorId: generateRandomColor(),
//     style: {} as any,
//     transform: {
//       rotate: 0,
//       scaleX: 1,
//       scaleY: 1,
//     },
//     geometry: {
//       type: "path",
//       points,
//     }
//   }
// }

// const drawPath = (context: CanvasRenderingContext2D, points: Point[]) => {
//   context.beginPath()

//   for (let i = 1; i < points.length; i++) {
//     const prev = points[i - 1]
//     const point = points[i]

//     context.moveTo(prev.x, prev.y)
//     context.lineTo(point.x, point.y)
//   }

//   context.lineJoin = "round"
//   context.lineCap = "round"

//   context.stroke()
//   context.closePath()
// }

// const lineSmooth = {
//   lengthMin: 8,
//   angle: 0.8,
//   match: false,
// };

// const shapes: ShapeDomain.CanvasShape[] = [testShape]

// const brush: Point = {
//   x: 0,
//   y: 0,
// }

// const mouse: Point = {
//   x: 0,
//   y: 0,
// }

// const createCanvas = () => {
//   const canvas = document.createElement("canvas")
//   const context = canvas.getContext("2d") as CanvasRenderingContext2D

//   canvas.oncontextmenu = (e) => e.preventDefault()

//   canvas.width = window.innerWidth
//   canvas.height = window.innerHeight

//   canvas.style.position = "absolute"
//   canvas.style.top = "0px"
//   canvas.style.left = "0px"

//   document.body.appendChild(canvas)

//   const remove = () => {
//     document.body.removeChild(canvas)
//   }

//   return {
//     context,
//     canvas,
//     remove,
//   }
// }

// const { canvas, context } = createCanvas()
// context.lineCap = "round"
// context.lineJoin = "round"

// const pointerMove$ = rx.fromEvent<PointerEvent>(canvas, "pointermove").pipe(rx.share())
// const pointerDown$ = rx.fromEvent<PointerEvent>(canvas, "pointerdown").pipe(rx.share())
// const pointerUp$ = rx.fromEvent<PointerEvent>(canvas, "pointerup").pipe(rx.share())

// const updateBrushPosition = (mousePoint: Point) => {
//   mouse.x = mousePoint.x
//   mouse.y = mousePoint.y

//   const dx = mouse.x - brush.x
//   const dy = mouse.y - brush.y
//   const dist = Math.hypot(dx, dy)

//   if (dist > DRAW_CONFIG.lazyRadius) {
//     const nx = dx / dist
//     const ny = dy / dist

//     const targetX = mouse.x - nx * DRAW_CONFIG.lazyRadius
//     const targetY = mouse.y - ny * DRAW_CONFIG.lazyRadius

//     brush.x += (targetX - brush.x)
//     brush.y += (targetY - brush.y)
//   }
// }

// let isDrawing = false

// pointerMove$.pipe(rx.tap((event) => {
//   updateBrushPosition(getPointFromEvent(event))

//   if (!isDrawing) {
//     context.clearRect(0, 0, canvas.width, canvas.height)
//     changeCursorToBrush(context, mouse, brush)
//     render()
//   }
// })).subscribe()

// pointerDown$.pipe(
//   rx.switchMap((event) => {
//     const startPoint = getPointFromEvent(event)
//     const innerPath: Point[] = [{ ...brush }]

//     if (brush.x === 0 && brush.y === 0) {
//       brush.x = startPoint.x
//       brush.y = startPoint.y
//     }

//     isDrawing = true

//     return pointerMove$.pipe(
//       rx.tap(() => {

//         innerPath.push({ ...brush })

//         context.clearRect(0, 0, canvas.width, canvas.height)

//         render()
//         changeCursorToBrush(context, mouse, brush)

//         context.strokeStyle = DRAW_CONFIG.strokeColor
//         context.lineWidth = DRAW_CONFIG.lineWidth

//         drawPath(context, innerPath)
//       }),
//       rx.takeUntil(pointerUp$.pipe(rx.tap(() => {
//         const path = innerPath.map((point) => [point.x, point.y])

//         const penPathShape = buildPenPathShape(simplifyLineRDP(path, lineSmooth.lengthMin).map(([x, y]) => ({ x, y })))
//         shapes.push(penPathShape)
//         context.clearRect(0, 0, canvas.width, canvas.height)
//         render()

//         getBitmapFromPathGeometry(penPathShape)

//         isDrawing = false
//       })))
//     )
//   })
// ).subscribe()

// function renderPenPath(context: CanvasRenderingContext2D, points: Point[], rotate: number) {
//   const rectFromPath = getAABBSize(getRotatedPolygoneAABB(points, rotate))

//   const shiftX = rectFromPath.x + rectFromPath.width / 2
//   const shiftY = rectFromPath.y + rectFromPath.height / 2

//   context.save()
//   context.translate(shiftX, shiftY)
//   context.rotate(rotate)

//   const currentLine = points.map((point) => [point.x - shiftX, point.y - shiftY])

//   context.strokeStyle = DRAW_CONFIG.strokeColor
//   context.lineWidth = DRAW_CONFIG.lineWidth

//   drawSmoothedLine(context, smoothLine(currentLine, lineSmooth.angle, lineSmooth.match))
//   context.restore()
// }

// function render() {
//   shapes.forEach((shape) => {
//     if (shape.kind === "pen") {
//       if (shape.geometry.type === "path") {
//         const bitmap = CacheBitmapShape.get(shape.id)

//         const boundingBox = getAABBSize(getRotatedPolygoneAABB(shape.geometry.points, shape.transform.rotate), DRAW_CONFIG.lineWidth)

//         if (isNotUndefined(bitmap)) {

//           context.drawImage(
//             bitmap,
//             boundingBox.x,
//             boundingBox.y,
//             boundingBox.width,
//             boundingBox.height
//           )
//         } else {
//           renderPenPath(context, shape.geometry.points, shape.transform.rotate)

//           context.save()
//           context.beginPath()
//           context.strokeStyle = "red"
//           context.lineWidth = 1
//           context.rect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height)
//           context.stroke()
//           context.restore()
//         }
//       }
//     }
//   })
// }

// render()

// const MAX_BEND = 40

// function drawConnection(context: CanvasRenderingContext2D, start: Point, end: Point) {
//   const dx = end.x - start.x
//   const dy = end.y - start.y
//   const dist = Math.hypot(dx, dy)

//   context.save()
//   context.beginPath()
//   context.moveTo(start.x, start.y)

//   context.strokeStyle = "black"

//   if (dist > DRAW_CONFIG.lazyRadius) {
//     context.lineTo(end.x, end.y)
//   } else {
//     const mx = (start.x + end.x) / 2
//     const my = (start.y + end.y) / 2

//     const nx = -dy / dist
//     const ny = dx / dist

//     const t = 1 - dist / DRAW_CONFIG.lazyRadius
//     const bend = t * MAX_BEND

//     const cx = mx + nx * bend
//     const cy = my + ny * bend

//     context.quadraticCurveTo(cx, cy, end.x, end.y)
//   }

//   context.lineWidth = 2
//   context.setLineDash([6, 4])
//   context.stroke()
//   context.restore()
// }

// function changeCursorToBrush(context: CanvasRenderingContext2D, mouse: Point, brush: Point) {
//   context.beginPath()
//   context.fillStyle = DRAW_CONFIG.strokeColor
//   context.arc(brush.x, brush.y, DRAW_CONFIG.lineWidth / 2, 0, Math.PI * 2)
//   context.fill()

//   context.beginPath()
//   context.fillStyle = "black"
//   context.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2)
//   context.fill()

//   drawConnection(context, brush, mouse)
// }
