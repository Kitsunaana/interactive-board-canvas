import { useCallback, useRef, type RefCallback } from "react";
import { CanvasCamera } from "./new/camera/model";
import { GridToRenderLevels, GridViewCanvas } from "./grid-map";
import "./index.css"
import { useSubscribeToCameraZoom } from "./new/camera/view";
import { clsx } from "clsx"

export function App() {
  const animationRef = useRef<number | null>(null);

  const { zoom, onZoomIn, onZoomOut } = useSubscribeToCameraZoom()

  const subscibeToCanvas: RefCallback<HTMLCanvasElement> = useCallback((canvas) => {
    const ctx = canvas?.getContext("2d");

    if (!ctx || !canvas) throw new Error("Failed to get context");

    const canvasCamera = new CanvasCamera(canvas);
    const gridToRenderLevels = new GridToRenderLevels(canvasCamera);
    const gridViewCanvas = new GridViewCanvas(gridToRenderLevels, canvas, canvasCamera);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.translate(canvasCamera.camera.x, canvasCamera.camera.y)
      ctx.scale(canvasCamera.camera.scale, canvasCamera.camera.scale)

      canvasCamera.update()

      gridViewCanvas.toDrawGrid(ctx);

      ctx.restore()
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animationRef.current!);
  }, [])

  return (
    <>
      <canvas
        className="bg-[#f2f2f2]"
        ref={subscibeToCanvas}
        width={window.innerWidth}
        height={window.innerHeight}
      />

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
