import { addPoint, distance, getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point"
import { isRectIntersectionV2 } from "@/shared/lib/rect"
import { _u } from "@/shared/lib/utils"
import type { Point } from "@/shared/type/shared"
import { isNull } from "lodash"
import * as rx from "rxjs"
import { isShape } from "../domain/is"
import type { Selection } from "../domain/selection"
import type { SelectionArea } from "../domain/selection-area"
import type { Shape } from "../domain/shape"
import { type Camera, camera$ } from "../modules/camera"
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$, wheel$ } from "../modules/pick-node"
import { autoSelectionBounds$ } from "../view-model/selection-bounds"
import { goToShapesDragging, isIdle, isShapesDragging, viewState$ } from "../view-model/state"
import { shapes$ } from "./shapes"

const isValidShapeInteraction = ({ selectionBounds, point, node }: {
  selectionBounds: SelectionArea | null
  point: Point
  node: any
}) => {
  if (isNull(selectionBounds)) return isShape(node)

  return isShape(node) || isRectIntersectionV2({
    rect: selectionBounds.area,
    point: point,
  })
}

const mapPointerMoveToMovedShapes = ({ event, camera, shapes, startPoint, selectedIds }: {
  selectedIds: Selection
  event: PointerEvent
  startPoint: Point
  shapes: Shape[]
  camera: Camera
}) => {
  const distance = subtractPoint(startPoint, screenToCanvas({
    point: getPointFromEvent(event),
    camera,
  }))

  return shapes.map((shape) => (
    selectedIds.has(shape.id)
      ? _u.merge(shape, addPoint(shape, distance))
      : shape
  ))
}

export const shapesDraggingFlow$ = mouseDown$.pipe(
  rx.withLatestFrom(viewState$.pipe(rx.filter(isIdle))),

  rx.filter(([{ event }]) => event.button === 0),

  rx.switchMap(([mouseDown]) => rx.of(mouseDown).pipe(
    rx.withLatestFrom(autoSelectionBounds$),
    rx.map(([downEvent, selectionBounds]) => ({ ...downEvent, selectionBounds })),
    rx.filter(({ node, point, selectionBounds }) => {
      return isValidShapeInteraction({ selectionBounds, point, node })
    }),
  )),

  rx.switchMap(({ event: downEvent, node: shape, point: startPoint }) => {
    const startPointInScreen = getPointFromEvent(downEvent)

    const sharedMove$ = pointerMove$.pipe(rx.takeWhile((event) => !event.shiftKey), rx.share())

    const waitForThreshold$ = sharedMove$.pipe(
      rx.filter((event) => distance(startPointInScreen, getPointFromEvent(event)) >= 8),
      rx.withLatestFrom(viewState$.pipe(rx.filter(isIdle))),
      rx.take(1),
      rx.tap(([_, { selectedIds }]) => {
        if (isShape(shape) && !selectedIds.has(shape.id)) {
          return viewState$.next(goToShapesDragging({
            needToDeselect: selectedIds.size === 0,
            selectedIds: new Set([shape.id]),
          }))
        }

        return viewState$.next(goToShapesDragging({ selectedIds }))
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$, wheel$))
    )

    const drag$ = waitForThreshold$.pipe(
      rx.withLatestFrom(camera$, shapes$, viewState$.pipe(rx.filter(isShapesDragging))),
      rx.switchMap(([_, camera, shapes, { selectedIds }]) => sharedMove$.pipe(
        rx.skip(1),
        rx.map((event) => mapPointerMoveToMovedShapes({ selectedIds, startPoint, camera, shapes, event })),
        rx.takeUntil(rx.merge(pointerUp$, pointerLeave$, wheel$)),
      ))
    )

    return drag$
  })
)
