import type { ClientShape } from "@/entities/shape/model/types"
import { addPoint, distance, getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point"
import { isRectIntersectionV2 } from "@/shared/lib/rect"
import { _u } from "@/shared/lib/utils"
import type { Point } from "@/shared/type/shared"
import { isNull } from "lodash"
import * as rx from "rxjs"
import type { SelectionBounds } from "../domain/selection-area"
import { type Camera, camera$, spacePressed$ } from "../modules/camera"
import { mouseDown$, pointerLeave$, pointerMove$, pointerUp$, wheel$ } from "../modules/pick-node"
import type { HitTarget } from "../modules/pick-node/_core"
import { autoSelectionBounds$ } from "../view-model/selection-bounds"
import { goToShapesDragging, isIdle, isShapesDragging, shapesToRender$, viewState$ } from "../view-model/state"

const isValidShapeInteraction = ({ selectionBounds, point, node }: {
  selectionBounds: SelectionBounds | null
  node: HitTarget
  point: Point
}) => {
  if (isNull(selectionBounds)) return node.type === "shape"

  return node.type == "shape" || isRectIntersectionV2({
    rect: selectionBounds.area,
    point: point,
  })
}

const mapPointerMoveToMovedShapes = ({ event, camera, shapes, startPoint }: {
  shapes: ClientShape[]
  event: PointerEvent
  startPoint: Point
  camera: Camera
}): ClientShape[] => {
  const distance = subtractPoint(startPoint, screenToCanvas({
    point: getPointFromEvent(event),
    camera,
  }))

  return shapes.map((shape) => {
    if (shape.client.isSelected && shape.geometry.kind === "rectangle-geometry") {
      return {
        ...shape,
        geometry: _u.merge(shape.geometry, addPoint(shape.geometry, distance))
      } as ClientShape
    }

    return shape
  })
}

export const shapesDraggingFlow$ = mouseDown$.pipe(
  rx.withLatestFrom(viewState$.pipe(rx.filter(isIdle))),

  rx.filter(([{ event }]) => event.button === 0),

  rx.switchMap(([downEvent, viewState]) => {
    return rx.of({ downEvent, viewState }).pipe(
      rx.withLatestFrom(spacePressed$),
      rx.filter(([_, spacePressed]) => spacePressed === false),
      rx.map(() => [downEvent]),
    )
  }),

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
      rx.filter((event) => {
        return distance(startPointInScreen, getPointFromEvent(event)) >= 8
      }),
      rx.withLatestFrom(viewState$.pipe(rx.filter(isIdle))),
      rx.take(1),
      rx.tap(([_, { selectedIds }]) => {
        if (shape.type === "shape" && !selectedIds.has(shape.shapeId)) {
          return viewState$.next(goToShapesDragging({
            needToDeselect: selectedIds.size === 0,
            selectedIds: new Set([shape.shapeId]),
          }))
        }

        return viewState$.next(goToShapesDragging({ selectedIds }))
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$, wheel$))
    )

    const drag$ = waitForThreshold$.pipe(
      rx.withLatestFrom(camera$, shapesToRender$, viewState$.pipe(rx.filter(isShapesDragging))),
      rx.switchMap(([_, camera, shapes]) => sharedMove$.pipe(
        rx.skip(1),
        rx.map((event) => mapPointerMoveToMovedShapes({ startPoint, camera, shapes, event })),
        rx.takeUntil(rx.merge(pointerUp$, pointerLeave$, wheel$)),
      ))
    )

    return drag$
  })
)
