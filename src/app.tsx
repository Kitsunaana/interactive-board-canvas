import { Signal, useSignal } from "@preact/signals-react";
import { clsx } from "clsx";
import { useEffect, useRef } from "react";
import "./collect";
// import "./collect-v2";
import "./index.css";
import { useSubscribeToCameraZoom } from "./new/camera/view";
import { type ViewModelV2 } from "./nodes/view-model/idle";
import { isRectIntersection } from "./point";
import type { Camera, Point, Rect } from "./type";

const getPointFromEvent = (event: PointerEvent | MouseEvent): Point => {
  return {
    x: event.offsetX,
    y: event.offsetY,
  }
}

type SubscibeToElementEvents<Key extends keyof HTMLElementEventMap, Types extends Key[]> = {
  [Prop in Types[number]]?: (event: HTMLElementEventMap[Prop]) => void
}

const subscibeToElementEvents = <Key extends keyof HTMLElementEventMap, Types extends Key[]>(
  element: HTMLElement,
  types: Types,
  events: SubscibeToElementEvents<Key, Types>
) => {
  const unsubscribes = types.map((type) => {
    const listener = <Event extends Key>(event: HTMLElementEventMap[Event]) => events[type]?.(event)
    element.addEventListener(type, listener)

    return () => (
      element.removeEventListener(type, listener)
    )
  })

  return () => (
    unsubscribes.forEach((unsubscribe) => unsubscribe())
  )
}

const getTriggerEeventForSticker = ({ viewModel, camera }: {
  viewModel: Signal<ViewModelV2>
  camera: Camera
}) => (
  (event: PointerEvent | MouseEvent) => {
    viewModel.value.nodes.forEach((rect) => {
      const point: Point = getPointFromEvent(event)

      const isIntersection = isRectIntersection({
        camera,
        point,
        rect,
      })

      if (isIntersection) {
        ({
          mousedown: rect?.onMouseDown,
          mouseup: rect?.onMouseUp,
          click: rect?.onClick,
        })[event.type]?.call(null, event as any)
      }
    })
  }
)

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
  useSignal()

  const animationRef = useRef<number | null>(null);

  const { zoom, onZoomIn, onZoomOut } = useSubscribeToCameraZoom()

  useEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const context = canvas?.getContext("2d");

    if (!context || !canvas) throw new Error("Failed to get context");

    // const triggerEeventForSticker = getTriggerEeventForSticker({ viewModel, camera })

    // subscibeToElementEvents(canvas, ["click", "mousedown", "mouseup"], {
    //   mousedown: triggerEeventForSticker,
    //   mouseup: triggerEeventForSticker,
    //   click: triggerEeventForSticker,
    // })

    // const draw = () => {
    //   animationRef.current = requestAnimationFrame(draw);
    //   context.clearRect(0, 0, canvas.width, canvas.height)

    //   context.save()
    //   context.translate(canvasCamera.camera.x, canvasCamera.camera.y)
    //   context.scale(canvasCamera.camera.scale, canvasCamera.camera.scale)

    //   canvasCamera.update()

    //   gridViewCanvas.toDrawGrid(context);

    //   viewModel.value.nodes.forEach((sticker) => {
    //     context.beginPath()
    //     context.shadowOffsetX = 2
    //     context.shadowOffsetY = 8
    //     context.shadowBlur = 16
    //     context.shadowColor = "#dbdad4"

    //     context.rect(sticker.x, sticker.y, sticker.width, sticker.height);
    //     context.fillStyle = "#ffff88";
    //     context.fill();

    //     if (sticker.isSelected) {
    //       const activeBoxDots = getActiveBoxDots({
    //         rect: sticker,
    //         camera,
    //       })

    //       drawActiveBox({
    //         rect: sticker,
    //         activeBoxDots,
    //         context,
    //         camera,
    //       })
    //     }

    //     context.closePath()
    //   })

    //   context.restore()
    // };

    // animationRef.current = requestAnimationFrame(draw);

    return () => {
      // cancelAnimationFrame(animationRef.current!);
    }
  }, [])

  return (
    <>
      <div className="flex items-center gap-2 absolute bottom-4 right-4 bg-white shadow-xl p-1 rounded-md text-sm text-gray-800 font-bold">
        <button
          onClick={onZoomOut}
          className={clsx(
            "w-[40px] h-[40px] cursor-pointer rounded-md transition-all duration-100 hover:bg-[#f1f2f5] relative",

            "before:content-[''] before:block before:w-[16px] before:h-[2px] before:-translate-y-1/2",
            "before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:bg-gray-900"
          )}
        />

        <button
          data-zoom={zoom}
          className={clsx(
            "relative w-[52px] h-[40px] cursor-pointer rounded-md transition-all duration-100 hover:bg-[#f1f2f5]",
            "before:content-[attr(data-zoom)] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:text-sm before:font-bold before:text-gray-900"
          )}
        />

        <button
          onClick={onZoomIn}
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
