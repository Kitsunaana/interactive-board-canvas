import { bind } from "@react-rxjs/core"
import * as rx from "rxjs"
import type { Camera } from "../modules/camera"
import { viewport } from "../modules/camera/viewport"

const toPercentage = (camera: Camera) => `${Math.round(camera.scale * 100)}%`

export const [useZoom] = bind(viewport.camera$.pipe(rx.map(toPercentage)), "100%")

export const zoomOut = () => {
  viewport.zoomTrigger$.next("zoomOut")
}

export const zoomIn = () => {
  viewport.zoomTrigger$.next("zoomIn")
}