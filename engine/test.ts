; import { Group } from "./Group";
import "./index.css";
import { Layer } from "./Layer";
import { Point } from "./maths";
import { EllipseShape } from "./shapes/Ellipse";
import { PolygonShape } from "./shapes/Polygon";
import { Stage } from "./Stage";
import { Transformer } from "./world/Transformer";

const stage = new Stage({
  height: window.innerHeight,
  width: window.innerWidth,
  draggable: false,
});

const layer = new Layer();

const points1 = [
  { x: 200, y: 200 },
  { x: 300, y: 200 },
  { x: 300, y: 120 },
];
const points2 = [
  { x: 400, y: 400 },
  { x: 420, y: 300 },
  { x: 440, y: 350 },
  { x: 500, y: 300 },
  { x: 500, y: 400 },
];

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
];

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
];

const polygonShape1 = new PolygonShape({
  initialPoints: points2,
  sketchStyle: false,
  lineWidth: 3,
  tension: 0.0,
  draggable: true
});

// polygonShape1.scale({ x: 2, y: 1 })
// polygonShape1.rotate(0.3)

polygonShape1.cache({
  drawBorder: true,
  offset: 10,
})

polygonShape1.canDragging(true)

const polygonShape2 = new PolygonShape({ initialPoints: points4, lineWidth: 1 });
const polygonShape3 = new PolygonShape({ initialPoints: points1, tension: 0.0 });

polygonShape3.canDragging(true)

polygonShape2.closed(false)
polygonShape1.addClassname("test")
polygonShape2.tension(0.2)

const transformer = new Transformer()
const group = new Group()

const ellipseTest = new EllipseShape(600, 300, 40, 20)

group.children(polygonShape2, polygonShape3)
transformer.children(polygonShape1, group, ellipseTest)

// transformer.scale(new Point(0.5, 1))
transformer.rotate(0.3)

ellipseTest.canDragging(true)

// polygonShape1.translate({ x: 100, y: 0 })

// polygonShape1.translate({ x: 140, y: 140 })

// polygonShape1.scale({ x: 2, y: 2 })

// polygonShape1.rotate(0.4)

// group.rotate(0.6)
// transformer.rotate(0.3)
// polygonShape2.rotate(0.4)
// polygonShape2.scale({ x: 1.6, y: 1.3 })
// polygonShape2.translate({ x: 0, y: 200 })

// transformer.translate({ x: 100, y: 0 })

// const testGroupToTransform = new Group()
// testGroupToTransform.children(polygonShape2, polygonShape3)

// testGroupToTransform.rotate(0.5)
// polygonShape3.rotate(0.4)

// testGroupToTransform.scale({ x: 1.5, y: 1 })

// testGroupToTransform.rotate(0.2)
// polygonShape3.scale(new Point(1.4, 1))
// testGroupToTransform.rotate(0.2)

// polygonShape3.translate({ x: 100, y: 10 })
// testGroupToTransform.translate({ x: 0, y: 60 })

// polygonShape3.rotate(0.3)
// testGroupToTransform.scale(new Point(1.9, 1))

// polygonShape2.scale(new Point(1, 1.6))

// polygonShape3.beginInteraction("rotate")
let angle = 0.005

// group.rotate(0.1)
// group.rotate(0.1)
// group.rotate(0.1)



const run = () => {
  // transformer.rotate(angle)
  // group.rotate(angle)
  // polygonShape1.rotate(angle)
  // polygonShape1.invalidateCache()
}

setInterval(() => {
  run()
}, 10)

polygonShape1.clearCache()
setTimeout(() => {
}, 2000)

// testGroupToTransform.rotate(0.5)
// polygonShape3.scale(new Point(2.5, 1))
// polygonShape3.rotate(0.4)
// testGroupToTransform.rotate(0.2)
// testGroupToTransform.scale(new Point(1.3, 1.2))
// testGroupToTransform.rotate(0.1)

// polygonShape1.rotate(0.2)
// testGroupToTransform.children(polygonShape1)
// polygonShape1.rotate(0.5)
// polygonShape1.scale(new Point(1.5, 1))

// testGroupToTransform.rotate(0.0)

// layer.add(testGroupToTransform)

const circleShape1 = new EllipseShape(500, 600, 40, 60);

layer.add(transformer)
stage.add(layer);

