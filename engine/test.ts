import { isNull } from "lodash";
import { Container } from "./core/Container";
import { Group } from "./core/Group";
import { Layer } from "./core/Layer";
import { Node } from "./core/Node";
import { Shape } from "./core/Shape";
import { Stage } from "./core/Stage";
import "./index.css";
import { CircleShape } from "./shapes/Circle";
import { PolygonShape } from "./shapes/Polygon";

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
  lineWidth: 1,
  tension: 0.0,
});

const polygonShape_1 = new PolygonShape({ initialPoints: points_1, lineWidth: 10 });
const polygonShape_2 = new PolygonShape({ initialPoints: points_2, tension: 0.0 });

stage.draggable.unsubscribe()
layer.draggable.unsubscribe()

stage.appendChild(layer)

const testShape = new CircleShape({ x: 0, y: 0, radius: 50 })

testShape.position = {
  x: 100,
  y: 260,
}

// testShape.transform.translate({ x: 10, y: 20 })
testShape.transform.scale({ x: 1.5, y: 2 })
// polygonShape_3.transform.skew({ x: 0.0, y: 0.5 })
// polygonShape_3.transform.skew({ x: -0.6, y: 0.0 })

// linearGradientGroup.appendChild(testShape)
// layer.appendChild(testShape)

// testShape.transform.rotate(0.6)
import { Transformer } from "./world/TransformerV2"
import {ContextModel} from "./core/SelectionManager";
// const rotateAndSkewGroup = new RotateAndSkewTransforGroup()
const resizeTransformer = new Transformer()

const group5 = new Group()
const group6 = new Group()

group5.appendChild(polygonShape_1, polygonShape_2)
group6.appendChild(group5, polygonShape_3)


layer.appendChild(group6, testShape, resizeTransformer)

// polygonShape_3.transform.rotate(0.4)
// polygonShape_3.transform.scale({ x: 1.5, y: 1.0 })


/**
 * InteractionManager
 * SelectionManager
 * DragManager
 * Transformer
 */


new ContextModel(layer)