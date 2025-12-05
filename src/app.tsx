import { clsx } from "clsx";
import { useZoomAdapter } from "./camera/adapter";
import "./collect";
import "./index.css";
import type { Camera, Rect } from "./type";
import "./xstate";

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

const getActiveBoxDots = ({ rect, camera }: {
  rect: Rect
  camera: Camera
}) => {
  const baseRadius = 5
  const scalePower = 0.75

  return [
    {
      x: rect.x - PADDING,
      y: rect.y - PADDING,
      radius: baseRadius / Math.pow(camera.scale, scalePower)
    },
    {
      x: rect.x + rect.width + PADDING,
      y: rect.y - PADDING,
      radius: baseRadius / Math.pow(camera.scale, scalePower)
    },
    {
      x: rect.x + rect.width + PADDING,
      y: rect.y + rect.height + PADDING,
      radius: baseRadius / Math.pow(camera.scale, scalePower)
    },
    {
      x: rect.x - PADDING,
      y: rect.y + rect.height + PADDING,
      radius: baseRadius / Math.pow(camera.scale, scalePower)
    },
  ]
}

export function App() {
  const zoomAdapter = useZoomAdapter()

  return (
    <>
      <div className="flex items-center gap-2 absolute bottom-4 right-4 bg-white shadow-xl p-1 rounded-md text-sm text-gray-800 font-bold">
        <button
          onClick={zoomAdapter.onZoomOut}
          className={clsx(
            "w-[40px] h-[40px] cursor-pointer rounded-md transition-all duration-100 hover:bg-[#f1f2f5] relative",

            "before:content-[''] before:block before:w-[16px] before:h-[2px] before:-translate-y-1/2",
            "before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:bg-gray-900"
          )}
        />

        <button
          data-zoom={zoomAdapter.zoom}
          className={clsx(
            "relative w-[52px] h-[40px] cursor-pointer rounded-md transition-all duration-100 hover:bg-[#f1f2f5]",
            "before:content-[attr(data-zoom)] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:text-sm before:font-bold before:text-gray-900"
          )}
        />

        <button
          onClick={zoomAdapter.onZoomIn}
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
