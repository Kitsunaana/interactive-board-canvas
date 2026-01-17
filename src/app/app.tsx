import "../features/board/view-model/idle";
import "../render-loop";
import "./index.css";

import { clsx } from "clsx";

import { readyMiniMap } from "../features/board/modules/mini-map/_stream";

import { useResizedShapeSizeToView } from "@/features/board/view-model/use-resized-shape";
import { useZoom, zoomIn, zoomOut } from "@/features/board/view-model/use-zoom";

export function App() {
  const selectionBoundsRect = useResizedShapeSizeToView()
  const zoom = useZoom()

  return (
    <>
      <canvas
        id="map"
        ref={readyMiniMap}
        className="absolute z-101 bottom-4 left-4 bg-white shadow-xl p-1 rounded-md"
      />

      {selectionBoundsRect && (
        <div
          className="absolute bg-[#f4f5f6] text-xs border border-[#e1e1e1] py-2 px-3 rounded-md"
          style={{
            top: `${selectionBoundsRect.toView.y + selectionBoundsRect.toView.height}px`,
            left: `${selectionBoundsRect.toView.x + selectionBoundsRect.toView.width / 2}px`,
            transform: "translateX(-50%)"
          }}
        >
          {Math.round(selectionBoundsRect.original.width)}{" x "}{Math.round(selectionBoundsRect.original.height)}
        </div>
      )}

      <div className="flex items-center gap-2 absolute bottom-4 right-4 bg-white shadow-xl p-1 rounded-md text-sm text-gray-800 font-bold">
        <button
          onClick={zoomOut}
          className={clsx(
            "w-10 h-10 cursor-pointer rounded-md transition-all duration-100 hover:bg-[#f1f2f5] relative",

            "before:content-[''] before:block before:w-4 before:h-0.5 before:-translate-y-1/2",
            "before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:bg-gray-900"
          )}
        />

        <button
          data-zoom={zoom}
          className={clsx(
            "relative w-[52px] h-10 cursor-pointer rounded-md transition-all duration-100 hover:bg-[#f1f2f5]",
            "before:content-[attr(data-zoom)] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:text-sm before:font-bold before:text-gray-900"
          )}
        />

        <button
          onClick={zoomIn}
          className={clsx(
            "w-10 h-10 cursor-pointer rounded-md transition-all duration-100 hover:bg-[#f1f2f5] relative",

            "before:content-[''] before:block before:w-4 before:h-0.5 before:-translate-y-1/2",
            "before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:bg-gray-900",

            "after:content-[''] after:block after:w-4 after:h-0.5 after:-translate-y-1/2",
            "after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:bg-gray-900",
            "after:rotate-90"
          )}
        />
      </div>
    </>
  );
}
