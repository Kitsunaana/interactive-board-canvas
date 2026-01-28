import "../features/board/view-model/idle";
import "../features/board/view-model/selection-window";
import "../render-loop";
import "./index.css";

import { clsx } from "clsx";

import { readyMiniMap } from "../features/board/modules/mini-map/_stream";

import { useResizedShapeSizeToView } from "@/features/board/view-model/use-resized-shape";
import { useZoom, zoomIn, zoomOut } from "@/features/board/view-model/use-zoom";
import { isNil } from "lodash";

const ViewSizeResizingShape = () => {
  const sizeShape = useResizedShapeSizeToView()

  if (isNil(sizeShape)) return null

  return (
    <div
      className="absolute bg-[#f4f5f6] text-xs border border-[#e1e1e1] py-2 px-3 rounded-md"
      style={{
        top: `${sizeShape.toView.y + sizeShape.toView.height}px`,
        left: `${sizeShape.toView.x + sizeShape.toView.width / 2}px`,
        transform: "translateX(-50%)"
      }}
    >
      {Math.round(sizeShape.original.width)}{" x "}{Math.round(sizeShape.original.height)}
    </div>
  )
}

export function App() {
  const zoom = useZoom()

  return (
    <>
      <div className="absolute z-1001 top-2 left-1/2 -translate-x-1/2 bg-white shadow-xl p-1 rounded-md text-gray-800">
        <button className="flex justify-center items-center bg-[#e0dfff] w-9 h-9 rounded-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="size-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002" />
          </svg>
        </button>
      </div>

      <canvas
        id="map"
        ref={readyMiniMap}
        className="absolute z-101 bottom-4 left-4 bg-white shadow-xl p-1 rounded-md"
      />
      <ViewSizeResizingShape />


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

