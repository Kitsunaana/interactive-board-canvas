import { addPoint, getPointFromEvent } from "../point"
import { Group } from "./shapes/group"
import { PolygonV2 } from "./shapes/polygon-v2"
import { createDragEventsFlow } from "./transformer/v2/shared"

const canvas = document.createElement("canvas")
const context = canvas.getContext("2d") as CanvasRenderingContext2D

canvas.style.position = "absolute"
canvas.style.left = "0px"
canvas.style.top = "0px"

document.body.appendChild(canvas)

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const points1 = [{ x: 200, y: 200 }, { x: 300, y: 200 }, { x: 300, y: 120 }]
const points2 = [{ x: 402, y: 398 }, { x: 421, y: 300 }, { x: 439, y: 351 }, { x: 500, y: 300 }, { x: 500, y: 400 }]
const points3 = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]

const group2 = new Group({ x: 100, y: 100, name: "group2" })
const group1 = new Group({ x: 20, y: 20, name: "group1" })

window.addEventListener("pointermove", (event) => {
  group1.absolutePositionCursor.x = event.clientX
  group1.absolutePositionCursor.y = event.clientY

  group2.absolutePositionCursor.x = event.clientX
  group2.absolutePositionCursor.y = event.clientY
})

const shape1 = new PolygonV2({ points: points1, x: 20, y: 20, })
const shape2 = new PolygonV2({ points: points2 })
const shape3 = new PolygonV2({ points: points3 })

shape1.rotate(0.5)

group1.add(shape1, shape2)
group2.add(group1, shape3)

animate()
function animate() {
  context.clearRect(0, 0, canvas.width, canvas.height)

  context.save()
  group2.draw(context)
  context.restore()

  requestAnimationFrame(animate)
}

/**
 * Создаёт путь повёрнутого эллипса через 4 кривые Безье
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - центр X
 * @param {number} cy - центр Y
 * @param {number} rx - радиус по X (автоматически берёт модуль)
 * @param {number} ry - радиус по Y (автоматически берёт модуль)
 * @param {number} angle - поворот в радианах
 */
function createRotatedEllipsePath(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, angle: number) {
  rx = Math.abs(rx);
  ry = Math.abs(ry);

  // Ключевая константа для аппроксимации четверти эллипса
  const K = 4 * (Math.sqrt(2) - 1) / 3; // ≈ 0.5522847498

  // Кэшируем тригонометрию
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Вспомогательная функция: поворот + смещение точки
  const transform = (x: number, y: number) => {
    return [
      cx + x * cos - y * sin,
      cy + x * sin + y * cos
    ];
  };

  // === Строим путь ===
  ctx.beginPath();

  // Начало: правая точка эллипса
  const [x0, y0] = transform(rx, 0);
  ctx.moveTo(x0, y0);

  // Сегмент 1: (rx,0) → (0,ry)
  const [x1, y1] = transform(rx, K * ry);
  const [x2, y2] = transform(K * rx, ry);
  const [x3, y3] = transform(0, ry);
  ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);

  // Сегмент 2: (0,ry) → (-rx,0)
  const [x4, y4] = transform(-K * rx, ry);
  const [x5, y5] = transform(-rx, K * ry);
  const [x6, y6] = transform(-rx, 0);
  ctx.bezierCurveTo(x4, y4, x5, y5, x6, y6);

  // Сегмент 3: (-rx,0) → (0,-ry)
  const [x7, y7] = transform(-rx, -K * ry);
  const [x8, y8] = transform(-K * rx, -ry);
  const [x9, y9] = transform(0, -ry);
  ctx.bezierCurveTo(x7, y7, x8, y8, x9, y9);

  // Сегмент 4: (0,-ry) → (rx,0) — замыкание
  const [x10, y10] = transform(K * rx, -ry);
  const [x11, y11] = transform(rx, -K * ry);
  ctx.bezierCurveTo(x10, y10, x11, y11, x0, y0);

  ctx.closePath(); // Гарантирует замыкание пути
}