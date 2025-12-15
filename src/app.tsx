import "./index.css";
import "./render-loop";

import { map } from "rxjs"
import { wheelCamera$, zoomTrigger$ } from "./modules/camera"
import type { Camera, CameraState } from "./modules/camera"
import type { Rect } from "./type"
import { bind } from "@react-rxjs/core";
import { clsx } from "clsx"

const PADDING = 7

export const drawActiveBox = ({ context, rect, camera, activeBoxDots }: {
  activeBoxDots: ReturnType<typeof getActiveBoxDots>
  context: CanvasRenderingContext2D
  camera: Camera
  rect: Rect
}) => {
  const padding = 7

  context.beginPath()
  context.strokeStyle = "#314cd9"
  context.lineWidth = 0.2
  context.moveTo(rect.x - padding, rect.y - padding)
  context.lineTo(rect.x + rect.width + padding, rect.y - padding)
  context.lineTo(rect.x + rect.width + padding, rect.y + rect.height + padding)
  context.lineTo(rect.x - padding, rect.y + rect.height + padding)
  context.lineTo(rect.x - padding, rect.y - padding)
  context.closePath()
  context.stroke()

  const baseLineWidth = 0.45
  const scalePower = 0.75
  const baseRadius = 5

  const dotLineWidth = baseLineWidth / Math.pow(camera.scale, scalePower)
  const dotRadius = baseRadius / Math.pow(camera.scale, scalePower)

  context.save()
  context.fillStyle = "#ffffff"
  context.strokeStyle = "#aaaaaa"

  activeBoxDots.forEach((dot) => {
    context.beginPath()
    context.lineWidth = dotLineWidth
    context.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.closePath()
  })

  context.restore()
}

const BASE_RADIUS = 5
const SCALE_POWER = 0.75

type ActiveBoxDotsParams = {
  camera: Camera
  rect: Rect
}

const getActiveBoxDots = ({ rect, camera }: ActiveBoxDotsParams) => [
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x - PADDING,
    y: rect.y - PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x + rect.width + PADDING,
    y: rect.y - PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x + rect.width + PADDING,
    y: rect.y + rect.height + PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x - PADDING,
    y: rect.y + rect.height + PADDING,
  },
]

const toPercentage = (state: CameraState) => `${Math.round(state.camera.scale * 100)}%`

const [useZoomValue] = bind(wheelCamera$.pipe(map(toPercentage)), "100%")

const zoomOut = () => {
  zoomTrigger$.next({
    __event: "zoomOut"
  })
}

const zoomIn = () => {
  zoomTrigger$.next({
    __event: "zoomIn"
  })
}

export function App() {
  const zoomValue = useZoomValue()

  return (
    <>
      <div className="flex items-center gap-2 absolute bottom-4 right-4 bg-white shadow-xl p-1 rounded-md text-sm text-gray-800 font-bold">
        <button
          onClick={zoomOut}
          className={clsx(
            "w-[40px] h-[40px] cursor-pointer rounded-md transition-all duration-100 hover:bg-[#f1f2f5] relative",

            "before:content-[''] before:block before:w-[16px] before:h-[2px] before:-translate-y-1/2",
            "before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:bg-gray-900"
          )}
        />

        <button
          data-zoom={zoomValue}
          className={clsx(
            "relative w-[52px] h-[40px] cursor-pointer rounded-md transition-all duration-100 hover:bg-[#f1f2f5]",
            "before:content-[attr(data-zoom)] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:text-sm before:font-bold before:text-gray-900"
          )}
        />

        <button
          onClick={zoomIn}
          className={clsx(
            "w-[40px] h-[40px] cursor-pointer rounded-md transition-all duration-100 hover:bg-[#f1f2f5] relative",

            "before:content-[''] before:block before:w-[16px] before:h-[2px] before:-translate-y-1/2",
            "before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:bg-gray-900",

            "after:content-[''] after:block after:w-[16px] after:h-[2px] after:-translate-y-1/2",
            "after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:bg-gray-900",
            "after:rotate-90"
          )}
        />
      </div>
    </>
  );
}
