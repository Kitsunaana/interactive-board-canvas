import { Group } from "./Group";
import "./index.css";
import { Layer } from "./LayerV2";
import { CircleShape } from "./shapes/Circle";
import { PolygonShape } from "./shapes/Polygon";
import { Stage } from "./Stage";
import { LinearGradientGroup } from "./world/GradientControls/LinearGradientGroup";
import { RadialGradientGroup } from "./world/GradientControls/RadialGradientGroup";

const stage = new Stage({
  height: window.innerHeight,
  width: window.innerWidth / 2,
  draggable: false,
});

const layer = new Layer();

const points_1 = [
  { x: 60, y: 120 },
  { x: 60, y: 75 },
  { x: 90, y: 75 },
  { x: 90, y: 90 },
  { x: 135, y: 90 },
  { x: 135, y: 105 },
  { x: 90, y: 105 },
  { x: 90, y: 120 },
];

const points_2 = [
  { x: 200, y: 200 },
  { x: 300, y: 200 },
  { x: 300, y: 120 },
];

const points_3 = [
  { x: 400, y: 400 },
  { x: 420, y: 300 },
  { x: 440, y: 350 },
  { x: 500, y: 300 },
  { x: 500, y: 400 },
];

const polygonShape_3 = new PolygonShape({
  initialPoints: points_3,
  sketchStyle: false,
  draggable: true,
  lineWidth: 1,
  tension: 0.0,
});

const polygonShape_1 = new PolygonShape({ initialPoints: points_1, lineWidth: 10 });
const polygonShape_2 = new PolygonShape({ initialPoints: points_2, tension: 0.1 });

// const transformer = new Transformer()
const group = new Group()

// group.appendChild(polygonShape_3, polygonShape_1)
// transformer.appendChild(group, polygonShape_2)

// const creator = new CubicBezierPathCreator(layer)
stage.draggable.unsubscribe()
layer.draggable.unsubscribe()

// layer.appendChild(transformer)
stage.appendChild(layer)

const testShape = new CircleShape({ x: 0, y: 0, radius: 150 })
const linearGradientGroup = new LinearGradientGroup()

testShape.position = {
  x: 100,
  y: 60,
}

// testShape.transform.translate({ x: 10, y: 20 })
testShape.transform.scale({ x: 1.5, y: 2 })

linearGradientGroup.appendChild(testShape)
layer.appendChild(linearGradientGroup)

// testShape.transform.rotate(0.6)