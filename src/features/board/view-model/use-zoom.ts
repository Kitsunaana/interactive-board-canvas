import { bind } from "@react-rxjs/core"
import * as rx from "rxjs"
import type { Camera } from "../modules/camera"
import { camera$, zoomTrigger$ } from "../modules/camera"

const toPercentage = (state: Camera) => `${Math.round(state.scale * 100)}%`

export const [useZoom] = bind(camera$.pipe(rx.map(toPercentage)), "100%")

export const zoomOut = () => {
  zoomTrigger$.next({ action: "zoomOut" })
}

export const zoomIn = () => {
  zoomTrigger$.next({ action: "zoomIn" })
}