import { Group } from "./Group";
import "./index.css";
import { Layer } from "./Layer";
import { Circle, Polygon } from "./shapes";
import { getPointFromEvent } from "./shared/point";
import { Stage } from "./Stage";

const stage = new Stage({
  height: window.innerHeight,
  width: window.innerWidth,
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
const points02 = [{ x: 400, y: 400 }, { x: 420, y: 300 }, { x: 440, y: 350 }, { x: 500, y: 300 }, { x: 500, y: 400 }]

const polygon01 = new Polygon({
  isDraggable: true,
  points: points01,
  scaleX: 1.0,
  scaleY: 1.0,
})

const polygon011 = new Polygon({
  isDraggable: true,
  points: points02,
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

const circle = new Circle({
  fillColor: "red",
  fill: true,
  radius: 20,
  x: 400,
  y: 100,
})

const group = new Group({})
const groupFigures = new Group({})

group.add(polygon2, polygon01)
groupFigures.add(group)

layer.add(groupFigures)
stage.add(layer)

// group.scale({ x: 1.0, y: 1.4 })

// group.scale({ x: 1.5, y: 1.5 })
// group.translate({ x: 0, y: 100 })
// group.rotate(0.3)
// groupFigures.rotate(0.3)

// groupFigures.translate({ x: 100, y: 100 })
// groupFigures.scale({ x: 2, y: 1.1 })
groupFigures.isShowOrigins = true
group.isShowOrigins = true
polygon2.isShowOrigins = false

polygon2.tension = 0.13
// polygon2.setOrigin("scale", { x: 1, y: 0.5 })
// polygon2.scale({ x: 1.5, y: 1 })
// group.scale({ x: 1.0, y: 1.4 })
// polygon2.rotate(0.9)
// polygon2.isShowOrigins = true
groupFigures.add(polygon011)
// groupFigures.rotate(0.2)
// polygon011.isShowOrigins = true

// polygon2.translate({ x: 20, y: 0 })

const matrix2 = groupFigures.computeMatrix()
const currentAngle = Math.atan2(matrix2.b, matrix2.a)
const matrix3 = Matrix3x3.aroundOrigin(groupFigures.currentRelativeOrigins.rotate, () => Matrix3x3.rotate(-currentAngle))

import Konva from 'konva';
import { Matrix3x3, Point } from "./maths";
import { type EventObject } from "./behaviors/EventBehavior";

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

  first.on("a.a", (event) => {
    console.log("first")
  })

  first.fire("a.a")
  // first.fire("a.b")


  group.add(first, second)
  layer.add(group)

  stage.add(layer)
  stage.scale({ x: 1, y: 1 })

  stage.content.classList.add("bg-red-200")
}

// konvaRenderTest()



