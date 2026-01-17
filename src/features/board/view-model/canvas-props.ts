import { isNotNull } from "@/shared/lib/utils"
import * as rx from "rxjs"
import { camera$, canvasSegment$ } from "../modules/camera"
import { LEVELS, toDrawOneLevel } from "../ui/cavnas"

export const gridProps$ = canvasSegment$.pipe(
  rx.withLatestFrom(camera$),
  rx.map(([canvasProps, camera]) => (
    LEVELS
      .map(level => toDrawOneLevel({ ...canvasProps, camera, level }))
      .filter(isNotNull)
  ))
)
