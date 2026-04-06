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
  fill: true,
  stroke: false,
  scaleX: 1.0,
  scaleY: 1.0,
})

// polygon1.setOriginScale({ x: 0.5, y: 0.5 }, "rotate")
// polygon1.setOriginScale({ x: 0.0, y: 1.0 }, "scale")

// polygon1.rotate(0.2)
// polygon1.setOriginScale({ x: 0.0, y: 1.0 }, "scale")
// polygon1.rotate(0.9)
// polygon1.scale({ x: 1.9, y: 1.9 })
// polygon1.setOriginScale({ x: 0.5, y: 0.5 }, "rotate")

const group = new Group({})

group.add(polygon2, polygon1, polygon01)

group.setOriginScale({ x: 0.5, y: 0.5 }, "rotate")
group.rotatePolygon(0.4)
// group.scale({ x: 1.9, y: 1.9 })
// group.rotate(-0.4)

const transform = new Transformer({
  isDraggable: false,
})

// transform.add(polygon1, polygon2)
layer.add(group)

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

stage.add(layer)

import Konva from 'konva'

const konvaRenderTest = () => {
  const konva = {
    stage: new Konva.Stage({
      container: "app",
      draggable: false,
      height: 500,
      width: 500,
      x: 0,
      y: 0,
    }),

    layer: new Konva.Layer({
      draggable: true,
      height: 200,
      width: 200,
      x: 0,
      y: 0,
    })
  }

  konva.layer.add(
    new Konva.Rect({
      x: 150,
      y: 200,
      width: 100,
      height: 100,
      fill: "blue"
    }), new Konva.Rect({
      x: 300,
      y: 200,
      width: 100,
      height: 100,
      fill: "blue"
    })
  )

  konva.stage.add(konva.layer)
  konva.stage.scale({ x: 1, y: 1 })

  // konva.layer.rotate(19)
  // konva.layer.scale({ x: 2, y: 1.4 })

  konva.stage.content.classList.add("bg-red-200")
}

// konvaRenderTest()

