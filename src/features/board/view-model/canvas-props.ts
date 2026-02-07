import { isNotNull } from "@/shared/lib/utils"
import * as rx from "rxjs"
import { viewport } from "../modules/camera/viewport"
import { LEVELS, toDrawOneLevel } from "../ui/cavnas"

export const gridProps$ = viewport.canvasSegment$.pipe(
  rx.withLatestFrom(viewport.camera$),
  rx.map(([canvasProps, camera]) => (
    LEVELS
      .map((level) => toDrawOneLevel({ ...canvasProps, camera, level }))
      .filter(isNotNull)
  ))
)
