// import { generateRandomColor, toRGB } from "@/shared/lib/color"
// import { nanoid } from "nanoid"
// import type { RectangleGeometry, RectangleStyle } from "./types"

// import { fromEvent, map } from "rxjs"
// import "../../../app/index.css"
// import { getPointFromEvent } from "../point"

// type AnyMetadata = { type: string }

// type CreateRectangleParams<Metadata extends AnyMetadata> = {
//   metadata: Metadata
//   colorId: string
// }

// const nodesToRender = {
//   list: new Map(),

//   add: <Metadata extends AnyMetadata>(colorId: string, metadata: Metadata) => {
//     if (!nodesToRender.list.has(colorId)) {
//       nodesToRender.list.set(colorId, metadata)
//     }
//   },

//   remove: (colorId: string) => {
//     nodesToRender.list.delete(colorId)
//   }
// }

// const createNode = <Metadata extends AnyMetadata>({ metadata, colorId }: CreateRectangleParams<Metadata>) => {
//   nodesToRender.add(colorId, metadata)

//   return {
//     draw: (context: CanvasRenderingContext2D, geometry: RectangleGeometry, _style: RectangleStyle) => {
//       const centerX = geometry.x + geometry.width / 2
//       const centerY = geometry.y + geometry.height / 2

//       context.save()

//       context.fillStyle = colorId
//       context.strokeStyle = colorId

//       context.translate(centerX, centerY)
//       context.rotate(0)
//       context.rect(-geometry.width / 2, -geometry.height / 2, geometry.width, geometry.height)
//       context.fill()
//       context.stroke()
//       context.restore()
//     },

//     remove: () => {
//       nodesToRender.remove(colorId)
//     }
//   }
// }

// const rectangle = createNode({
//   colorId: generateRandomColor(),
//   metadata: {
//     type: "shape",
//     id: nanoid(),
//   },
// })

// const canvas = document.createElement("canvas")
// const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D

// canvas.style.backgroundColor = "#a8604f"

// canvas.width = window.innerWidth
// canvas.height = window.innerHeight

// document.body.appendChild(canvas)

// rectangle.draw(context, {
//   kind: "rectangle-geometry",
//   height: 100,
//   width: 100,
//   x: 100,
//   y: 100,
// }, {
//   strokeColor: "#b2f2bb",
//   fillColor: "#2f9e44",
//   borderRadius: 12,
//   lineWidth: 2,
//   opacity: 0,
// })

// const pointerDown$ = fromEvent<PointerEvent>(window, "pointerdown").pipe(
//   map((event) => {
//     const cursor = getPointFromEvent(event)
//     const [r, g, b] = context.getImageData(cursor.x, cursor.y, 1, 1).data

//     const pickedNode = nodesToRender.list.get(toRGB(r, g, b))

//     return pickedNode
//   })
// )

// pointerDown$.subscribe(node => console.log(node))