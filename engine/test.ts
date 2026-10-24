import "reflect-metadata"
import {Group} from "./core/Group";
import {Layer} from "./core/Layer";
import {Stage} from "./core/Stage";
import "./index.css";
import {CircleShape} from "./shapes/Circle";
import {PolygonShape} from "./shapes/Polygon";
// testShape.transform.rotate(0.6)
import {App} from "./core/__noname";
import {Background} from "./world/BG";

// const stage = new Stage({
//   height: window.innerHeight,
//   width: window.innerWidth,
//   draggable: false,
// });

// const layer = new Layer();
// const layer = new Background()

const points_1 = [
  {x: 60, y: 120},
  {x: 60, y: 75},
  {x: 90, y: 75},
  {x: 90, y: 90},
  {x: 135, y: 90},
  {x: 135, y: 105},
  {x: 90, y: 105},
  {x: 90, y: 120},
];

const points_2 = [
  {x: 200, y: 200},
  {x: 300, y: 200},
  {x: 300, y: 120},
];

const points_3 = [
  {x: 400, y: 400},
  {x: 420, y: 300},
  {x: 440, y: 350},
  {x: 500, y: 300},
  {x: 500, y: 400},
];

const polygonShape_3 = new PolygonShape({
  initialPoints: points_3,
  lineWidth: 1,
  tension: 0.0,
});

const polygonShape_1 = new PolygonShape({initialPoints: points_1, lineWidth: 10});
const polygonShape_2 = new PolygonShape({initialPoints: points_2, tension: 0.0});

const testShape = new CircleShape({x: 0, y: 0, radius: 50})

testShape.position = {
  x: 100,
  y: 260,
}

testShape.scale({x: 1.5, y: 1.5})

// const group5 = new Group()
// const group6 = new Group()


setTimeout(() => {
  // stage.appendChild(layer)
  // group5.appendChild(polygonShape_1, polygonShape_2)
  // group6.appendChild(group5, polygonShape_3)
  // layer.appendChild(group6, testShape)
  //
  // group6.rotate(0.2)
  //
  new App()
  //
  // const fn1 = () => {
  //   group6.scale({x: 1.5, y: 1})
  //   polygonShape_3.scale({x: 1.5, y: 1})
  //   return
  // }
  //
  // const fn2 = () => {
  //   group6.beginInteraction("scale")
  //   group6.updateInteraction({x: 1.5, y: 1})
  //   group6.endInteraction()
  //
  //   polygonShape_3.beginInteraction("scale")
  //   polygonShape_3.updateInteraction({x: 1.5, y: 1})
  //   polygonShape_3.endInteraction()
  // }

  // fn2()
})

