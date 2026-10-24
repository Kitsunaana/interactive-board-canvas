import {CircleShape, PolygonShape} from "./shapes";
import {Group} from "./core/Group";

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

export const polygonShape_3 = new PolygonShape({
  initialPoints: points_3,
  lineWidth: 1,
  tension: 0.0,
});

export const polygonShape_1 = new PolygonShape({initialPoints: points_1, lineWidth: 10});
export const polygonShape_2 = new PolygonShape({initialPoints: points_2, tension: 0.0});

export const circleShape_1 = new CircleShape({x: 0, y: 0, radius: 50})

circleShape_1.position = {
  x: 100,
  y: 260,
}

circleShape_1.scale({x: 1.5, y: 1.5})

export const group5 = new Group()
export const group6 = new Group()
