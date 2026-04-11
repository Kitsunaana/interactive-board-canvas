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
  { x: 90, y: 120 }
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
  stroke: false,
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

groupFigures.add(polygon2, polygon1)
group.add(groupFigures, polygon01)

layer.add(group)
stage.add(layer)

group._needShowOriginPoints = true
groupFigures._needShowOriginPoints = true

groupFigures.setOriginPoint("rotate", { x: 0.5, y: 0.5 })
group.setOriginPoint("rotate", { x: 0.5, y: 0.5 })

// groupFigures.rotatePolygon(0.5)
// group.setOriginPoint({ x: 0.5, y: 0.5 }, "rotate")
// group.rotatePolygon(0.4)
// group.setOriginPoint({ x: 0.0, y: 0.5 }, "scale")
// group.scalePolygon({ x: 1.9, y: 1.9 })
// groupFigures.rotatePolygon(0.5)
// group.rotatePolygon(-0.4)

const transform = new Transformer({
  isDraggable: false,
})

// transform.add(polygon1, polygon2)

const side: ResizeHandler = "e"

polygon1.on("pointerdown", (event) => {
  console.log("polygon1")
})

polygon2.on("pointerdown", (event) => {
  console.log("polygon2", event)
  event.cancelBubbles = true
})

groupFigures.on("pointerdown", () => {
  console.log("group figures")
})

window.addEventListener("pointerdown", (event) => {
  const nodes = layer.getAllChildren()

  let candidate: Shape | Group | null = null

  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].contains(event.clientX, event.clientY)) {
      candidate = nodes[i]
      break
    }
  }

  if (candidate) {
    const eventToNode: Record<string, any> = {
      cancelBubbles: false,
      currentTarget: candidate,
      target: candidate,
      evt: event,
    }

    candidate.fire("pointerdown", eventToNode)

    candidate.getAllParents().forEach((parent) => {
      eventToNode.currentTarget = parent

      if (eventToNode.cancelBubbles === false) {
        parent.fire("pointerdown", eventToNode)
      }
    })
  }
})

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

konvaRenderTest()

