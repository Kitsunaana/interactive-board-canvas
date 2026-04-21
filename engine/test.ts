import { type ResizeHandler, Transformer } from "./behaviors/Transformer";
import { Group } from "./Group";
import { Layer } from "./Layer";
import { Polygon } from "./shapes";
import { getPointFromEvent } from "./shared/point";
import { Stage } from "./Stage";
import "./index.css"

const stage = new Stage({
  height: 600,
  width: 600,
  draggable: false,
})

// stage.content.classList.add("bg-pink-500")

const layer = new Layer({
  isDraggable: false,
  scaleX: 1,
  scaleY: 1,
  x: 0,
  y: 0,
})

const points01 = [{ x: 200, y: 200 }, { x: 300, y: 200 }, { x: 300, y: 120 }]
// const points2 = [{ x: 400, y: 400 }, { x: 420, y: 300 }, { x: 440, y: 350 }, { x: 500, y: 300 }, { x: 500, y: 400 }]

const polygon01 = new Polygon({
  isDraggable: true,
  points: points01,
  scaleX: 1.0,
  scaleY: 1.0,
})

const polygon011 = new Polygon({
  isDraggable: true,
  points: points01.map(p => ({ ...p })),
  scaleX: 1.0,
  scaleY: 1.0,
})


// const polygon2 = new Polygon({
//   points: points2,
//   scaleX: 1.0,
//   scaleY: 1.0,
//   x: 0,
//   y: 0,
// })

const points1 = [
  { x: 45, y: 90 },
  { x: 45, y: 75 },
  { x: 60, y: 60 },
  { x: 75, y: 45 },
  { x: 90, y: 45 },
  { x: 105, y: 45 },
  { x: 120, y: 45 },
  { x: 135, y: 60 },
  { x: 150, y: 75 },
  { x: 150, y: 90 },
  { x: 150, y: 105 },
  { x: 150, y: 120 },
  { x: 135, y: 135 },
  { x: 120, y: 150 },
  { x: 105, y: 150 },
  { x: 90, y: 150 },
  { x: 75, y: 150 },
  { x: 60, y: 135 },
  { x: 45, y: 120 },
  { x: 45, y: 105 },
]

const points2 = [
  { x: 60, y: 120 },
  { x: 60, y: 75 },
  { x: 90, y: 75 },
  { x: 90, y: 90 },
  { x: 135, y: 90 },
  { x: 135, y: 105 },
  { x: 90, y: 105 },
  { x: 90, y: 120 },

  // { x: 100, y: 200 }, { x: 200, y: 200 }, { x: 300, y: 200 }, { x: 300, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 200 }
]

const polygon1 = new Polygon({
  isDraggable: true,
  points: points1,
  scaleX: 1.0,
  scaleY: 1.0,
})

const polygon2 = new Polygon({
  isDraggable: true,
  points: points2,
  fillColor: "orange",
  stroke: true,
  fill: true,
  scaleX: 1.0,
  scaleY: 1.0,
})

// polygon01.translate({ x, y: 0 })

// polygon1.setOriginScale({ x: 0.5, y: 0.5 }, "rotate")
// polygon1.setOriginScale({ x: 0.0, y: 1.0 }, "scale")

// polygon1.rotate(0.2)
// polygon1.setOriginScale({ x: 0.0, y: 1.0 }, "scale")
// polygon1.rotate(0.9)
// polygon1.scale({ x: 1.9, y: 1.9 })
// polygon1.setOriginScale({ x: 0.5, y: 0.5 }, "rotate")

const group = new Group({})
const groupFigures = new Group({})

groupFigures.add(polygon1, polygon2)
// group.add(groupFigures)

layer.add(groupFigures)
stage.add(layer)

// groupFigures.transformer.translate({ x: 200, y: 50 })
groupFigures.transformer.rotate(0.9)
// groupFigures.transformer.scale({ x: 2, y: 2 })
groupFigures.transformer.isShowOrigins = true

polygon2.transformer.isShowOrigins = false

polygon2.tension = 0.13
// polygon2.transformer.translate({ x: 201, y: 120 })
// polygon2.transformer.scale({ x: 2, y: 2 })
// polygon2.transformer.rotate(0.8)
// polygon2.transformer.scale({ x: 1.6, y: 1 })
// polygon2.transformer.setOrigin("scale", { x: 0, y: 0.5 })
// polygon2.transformer.scale({ x: 1.9, y: 1.6 })
// polygon2.transformer.skew({ x: 0.3, y: 0.0 })
// polygon2.transformer.setOrigin("rotate", { x: 1, y: 1 })
// polygon2.transformer.setOrigin("scale", { x: 0.5, y: 0.5 })
// polygon2.transformer.rotate(1.9)

const transform = new Transformer({
  isDraggable: false,
})

// polygon2.transformer.beginInteraction("scale")

window.addEventListener("pointermove", (event) => {
  const position = getPointFromEvent(event)
  const value = Point.divide(position, { x: 200, y: 200 })

  const nextX = Math.cos(value.x) * 2
  const nextY = Math.sin(value.y) * 2

  // polygon2.transformer.updateInteraction({
  //   x: nextX,
  //   y: nextY,
  // })
})

// transform.add(polygon1, polygon2) 

const side: ResizeHandler = "e"

const downCallback = (event: PointerEvent) => {
  transform.setInitialState()
  transform.setHandlePosition(side)
  transform.setPivotPosition(side)
  transform.setWorldPivot()

  const upCallback = () => {

    window.removeEventListener("pointerup", upCallback)
    window.removeEventListener("pointermove", moveCallback)
  }

  const moveCallback = (event: PointerEvent) => {
    transform.setTransformScale(getPointFromEvent(event))
    transform.applyTransform()
  }

  window.addEventListener("pointerup", upCallback)
  window.addEventListener("pointermove", moveCallback)
}

window.addEventListener("pointerdown", downCallback)

import Konva from 'konva'
import { Shape } from "./shapes/Shape";
import { nanoid } from "nanoid";
import { bind } from "lodash";
import { Point } from "./maths";
import { ShapeTransformerPreviewState } from "./behaviors/transformer/shape/_preview";

const konvaRenderTest = () => {
  const stage = new Konva.Stage({
    container: "app",
    draggable: false,
    height: 500,
    width: 500,
    x: 0,
    y: 0,
  })

  const layer = new Konva.Layer({
    draggable: false,
    height: 200,
    width: 200,
    x: 0,
    y: 0,
  })

  const first = new Konva.Rect({
    x: 150,
    y: 200,
    width: 100,
    height: 100,
    fill: "blue"
  })

  const second = new Konva.Rect({
    x: 190,
    y: 180,
    width: 100,
    height: 100,
    fill: "red"
  })

  const group = new Konva.Group({
    draggable: true
  })

  first.on("mouseleave", (event) => {
    console.log("first")
    event.cancelBubble = true
  })

  second.on("mouseleave", (event) => {
    console.log("second")
    // event.cancelBubble = true
  })

  group.on("mouseleave", () => {
    console.log("group")
  })

  group.add(first, second)
  layer.add(group)

  stage.add(layer)
  stage.scale({ x: 1, y: 1 })

  stage.content.classList.add("bg-red-200")
}

// konvaRenderTest()



