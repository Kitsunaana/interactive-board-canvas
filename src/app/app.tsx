import "../render-loop";
import "./index.css";

import { bind } from "@react-rxjs/core";
import { clsx } from "clsx";
import { isNil } from "lodash";
import { map } from "rxjs";
import type { CameraState } from "../features/board/modules/_camera/_domain";
import { wheelCamera$, zoomTrigger$ } from "../features/board/modules/_camera/_stream";
import { miniMapProperties$ } from "../features/board/modules/_mini-map/_stream";

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

const readyMiniMap = (instance: HTMLCanvasElement | null) => {
  if (!isNil(instance)) {
    miniMapProperties$.next({
      context: instance.getContext("2d"),
      canvas: instance,
    })
  }
}

export function App() {
  const zoomValue = useZoomValue()

  return (
    <>
      <canvas
        id="map"
        ref={readyMiniMap}
        className="absolute bottom-4 left-4 bg-white shadow-xl p-1 rounded-md"
      />

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
