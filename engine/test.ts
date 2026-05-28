import "./index.css";
import { Layer } from "./Layer";
import { Stage } from "./Stage";
import { SimObject } from "./world/sim-object"
import { CircleComponent } from "./components/circle-component"
import { PolygonComponent } from "./components/polygon-component";

const stage = new Stage({
  height: window.innerHeight,
  width: window.innerWidth,
  draggable: false,
})

const layer = new Layer({
  isDraggable: false,
  scaleX: 1,
  scaleY: 1,
  x: 0,
  y: 0,
})

const points1 = [{ x: 200, y: 200 }, { x: 300, y: 200 }, { x: 300, y: 120 }]
const points2 = [{ x: 400, y: 400 }, { x: 420, y: 300 }, { x: 440, y: 350 }, { x: 500, y: 300 }, { x: 500, y: 400 }]

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

  // { x: 100, y: 200 }, { x: 200, y: 200 }, { x: 300, y: 200 }, { x: 300, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 200 }
]

const circleSimObject = new SimObject()
const circleComponent = new CircleComponent(100, 200, 40)
const polygonComponent = new PolygonComponent(points1)

circleSimObject.addComponent(circleComponent)
circleSimObject.addComponent(polygonComponent)
// circleSimObject.rotate(0.5)

layer.add(circleSimObject)
stage.add(layer)

// const matrix2 = groupFigures.computeMatrix()
// const currentAngle = Math.atan2(matrix2.b, matrix2.a)
// const matrix3 = Matrix3x3.aroundOrigin(groupFigures.currentRelativeOrigins.rotate, () => Matrix3x3.rotate(-currentAngle))
