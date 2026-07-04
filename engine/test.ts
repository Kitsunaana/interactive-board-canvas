import { Group } from "./Group";
import "./index.css";
import { Layer } from "./Layer";
import { Point } from "./maths";
import { Ellipse } from "./shapes/Ellipse";
import { PolygonShape } from "./shapes/Polygon";
import { Stage } from "./Stage";
import { Tranformer } from "./world/Transformer";

const stage = new Stage({
  height: window.innerHeight,
  width: window.innerWidth,
  draggable: false,
})

const layer = new Layer()

const points1 = [{ x: 200, y: 200 }, { x: 300, y: 200 }, { x: 300, y: 120 }]
const points2 = [
  { x: 400, y: 400 }, 
  { x: 420, y: 300 }, 
  { x: 440, y: 350 }, 
  { x: 500, y: 300 }, 
  { x: 500, y: 400 },
]

const points3 = [
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
  { x: 45, y: 90 },
]

const points4 = [
  { x: 60, y: 120 },
  { x: 60, y: 75 },
  { x: 90, y: 75 },
  { x: 90, y: 90 },
  { x: 135, y: 90 },
  { x: 135, y: 105 },
  { x: 90, y: 105 },
  { x: 90, y: 120 },
  // { x: 60, y: 120 },
  // { x: 100, y: 200 }, { x: 200, y: 200 }, { x: 300, y: 200 }, { x: 300, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 200 }
]

const groupSimObject = new Group()

const polygonShape1 = new PolygonShape(points2)
const polygonShape2 = new PolygonShape(points4)
const polygonShape3 = new PolygonShape(points2)

const circleShape1 = new Ellipse(500, 600, 40, 60)
circleShape1.isShowOrigins = true
// circleShape1.rotate(0.5)
// circleShape1.scale(new Point(3, 3))
// circleShape1.rotate(0.5)

// polygonShape1.scale(new Point(1.3, 2.9))
// polygonShape1.rotate(0.5)

groupSimObject.children(polygonShape1)

const tranformer = new Tranformer()
tranformer.children(polygonShape1)

// groupSimObject.children(polygonShape3)

// polygonShape2.scale(new Point(3, 3))

// groupSimObject.children(circleShape1)  

// polygonShape1.rotate(0.5)
// groupSimObject.rotate(0.2)
// groupSimObject.scale(new Point(1, 1.0))

// groupSimObject.scale(new Point(0.5, 0.5))

// groupSimObject.beginInteraction("rotate")

// polygonShape2.beginInteraction("scale")

let angle = 0.01
let scale = 0
let frame = 0
setInterval(() => {
  frame++
  angle += 0.03
  scale = Math.sin(frame * 0.06) * 4

  // polygonShape2.scale(new Point(scale, scale))

  // groupSimObject.scale(new Point(scale, scale))

  // groupSimObject.rotate(angle)
}, 16)

// layer.add(groupSimObject)
layer.add(tranformer)
stage.add(layer)

// console.log(groupSimObject.getParent())

// console.log(polygonShape1.computeMatrix())
// console.log(groupSimObject.computeMatrix())

// polygonShape.on("pointerdown", () => {
  // console.log("CLICK")  
// })

// const matrix2 = groupFigures.computeMatrix()
// const currentAngle = Math.atan2(matrix2.b, matrix2.a)
// const matrix3 = Matrix3x3.aroundOrigin(groupFigures.currentRelativeOrigins.rotate, () => Matrix3x3.rotate(-currentAngle))
