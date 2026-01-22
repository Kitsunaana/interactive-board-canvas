import { match } from "@/shared/lib/match"
import { distance, getPointFromEvent, screenToCanvas, subtractPoint, type Camera } from "@/shared/lib/point"
import { isRectIntersectionV2 } from "@/shared/lib/rect"
import { isNotNull } from "@/shared/lib/utils"
import type { Point } from "@/shared/type/shared"
import { isNull } from "lodash"
import * as rx from "rxjs"
import { isBound, isCanvas, isCorner, isShape } from "../../domain/is"
import type { NodeBound, SelectionArea } from "../../domain/selection-area"
import { shapes$ } from "../../model"
import { getShapesResizeViaBoundStrategy, getShapesResizeViaCornerStrategy } from "../../model/shape-resize"
import { camera$ } from "../../modules/camera"
import { mouseDown$, mouseUp$, pointerLeave$, pointerMove$, pointerUp$, wheel$ } from "../../modules/pick-node"
import { autoSelectionBounds$, pressedResizeHandlerSubject$ } from "../selection-bounds"
import { goToIdle, goToShapesDragging, goToShapesResize, isIdle, viewModel$, viewState$, type IdleViewState } from "../state"
import { getMovedShapes } from "./moving"
import { shapeSelect } from "./selection"
import type { Shape } from "../../domain/shape"

const applyResizeViaBoundCursor = (node: NodeBound) => {
  document.documentElement.style.cursor = match(node, {
    bottom: () => "ns-resize",
    right: () => "ew-resize",
    left: () => "ew-resize",
    top: () => "ns-resize",
  }, "id")
}

const resetResizeCursor = () => {
  document.documentElement.style.cursor = "default"
}

const shapesResizeViaResizeHanlderFlow$ = mouseDown$.pipe(
  rx.map((downEvent) => downEvent.node),
  rx.filter(isCorner),
  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle), rx.map((state) => state.selectedIds)),
    autoSelectionBounds$.pipe(rx.filter(isNotNull), rx.map((selection) => selection.area)),
    viewModel$.pipe(rx.map((model) => model.nodes)),
    camera$
  ),
  rx.map(([handler, selectedIds, selectionArea, shapes, camera]) => ({ selectionArea, selectedIds, camera, shapes, handler })),
  rx.switchMap(({ camera, handler, shapes, selectedIds, selectionArea }) => {
    const sharedMove$ = pointerMove$.pipe(rx.share())

    const resizeShapesStrategy = getShapesResizeViaCornerStrategy({ selectionArea, handler, shapes })

    return rx.merge(
      sharedMove$.pipe(
        rx.take(1),
        rx.tap(() => {
          pressedResizeHandlerSubject$.next(handler)

          viewState$.next(goToShapesResize({ selectedIds }))
        }),
        rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
        rx.ignoreElements(),
      ),

      sharedMove$.pipe(
        rx.map((moveEvent) => {
          const cursorPosition = getPointFromEvent(moveEvent)
          const cursor = screenToCanvas({ camera, point: cursorPosition })

          return resizeShapesStrategy({
            proportional: moveEvent.shiftKey,
            reflow: moveEvent.ctrlKey,
            cursor,
          })
        }),
        rx.takeUntil(
          rx.merge(pointerUp$, pointerLeave$).pipe(rx.tap(() => {
            viewState$.next(goToIdle({ selectedIds }))
            resetResizeCursor()
          }))
        ),
      )
    )
  })
)

shapesResizeViaResizeHanlderFlow$.subscribe(shapes$)

const shapesResizeFlow$ = mouseDown$.pipe(
  rx.map((downEvent) => downEvent.node),
  rx.filter(isBound),
  rx.withLatestFrom(
    viewState$.pipe(rx.filter(isIdle), rx.map((state) => state.selectedIds)),
    autoSelectionBounds$.pipe(rx.filter(isNotNull), rx.map((selection) => selection.area)),
    viewModel$.pipe(rx.map((model) => model.nodes)),
    camera$
  ),
  rx.map(([handler, selectedIds, selectionArea, shapes, camera]) => ({ selectionArea, selectedIds, camera, shapes, handler })),
  rx.switchMap(({ camera, handler, shapes, selectedIds, selectionArea }) => {
    const resizeShapesStrategy = getShapesResizeViaBoundStrategy({ selectionArea, shapes, handler })

    const sharedMove$ = pointerMove$.pipe(rx.share())

    return rx.merge(
      sharedMove$.pipe(
        rx.take(1),
        rx.tap(() => {
          applyResizeViaBoundCursor(handler)

          pressedResizeHandlerSubject$.next(handler)
          viewState$.next(goToShapesResize({ selectedIds }))
        }),
        rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
        rx.ignoreElements(),
      ),

      sharedMove$.pipe(
        rx.map((moveEvent) => {
          const cursorPosition = getPointFromEvent(moveEvent)
          const canvasPoint = screenToCanvas({ camera, point: cursorPosition })

          return resizeShapesStrategy({
            proportional: moveEvent.shiftKey,
            reflow: moveEvent.ctrlKey,
            cursor: canvasPoint,
          })
        }),
        rx.takeUntil(
          rx.merge(pointerUp$, pointerLeave$).pipe(rx.tap(() => {
            viewState$.next(goToIdle({ selectedIds }))
            resetResizeCursor()
          }))
        ),
      )
    )
  })
)

shapesResizeFlow$.subscribe(shapes$)

const shapeSelectFlow$ = mouseUp$.pipe(
  rx.filter(({ event }) => !event.shiftKey && event.button === 0),
  rx.filter(({ node }) => isShape(node) || isCanvas(node)),
  rx.withLatestFrom(viewState$),
  rx.map(([upEvent, state]) => ({ ...upEvent, state })),
  rx.switchMap(({ node, event, state }) => match(state, {
    shapesResize: (state) => rx.of(state),

    shapesDragging: (state) => rx.of(state.needToDeselect ? goToIdle() : state),

    idle: (idleState) => match(node, {
      grid: () => rx.of(goToIdle()),

      bound: () => rx.of(idleState),
      arrow: () => rx.of(idleState),
      square: () => rx.of(idleState),

      circle: ({ id: shapeId }) => rx.of(shapeSelect({ idleState, shapeId, event })),
      rectangle: ({ id: shapeId }) => rx.of(shapeSelect({ idleState, shapeId, event })),
    }),
  })),
)

shapeSelectFlow$.subscribe(viewState$)

// viewState$.subscribe(console.log)

const isValidShapeInteraction = ({ selectionBounds, startPoint, shape }: {
  selectionBounds: SelectionArea | null
  startPoint: Point
  shape: any
}) => {
  console.log(shape, selectionBounds)
  if (isNull(selectionBounds)) return isShape(shape)

  return isShape(shape) || isRectIntersectionV2({
    rect: selectionBounds.area,
    point: startPoint,
  })
}

const mapPointerMoveToMovedShapes = ({ event, camera, shapes, startPoint }: {
  event: PointerEvent
  startPoint: Point
  shapes: Shape[]
  camera: Camera
}) => {
  const distance = subtractPoint(startPoint, screenToCanvas({
    point: getPointFromEvent(event),
    camera,
  }))

  return getMovedShapes({
    selectedIds: viewState$.getValue().selectedIds,
    distance,
    shapes,
  })
}

const shapesDraggingFlow$ = mouseDown$.pipe(
  rx.withLatestFrom(viewState$.pipe(rx.filter(isIdle))),

  rx.filter(([{ event }]) => event.button === 0),

  rx.switchMap(([mouseDown]) => rx.of(mouseDown).pipe(
    rx.withLatestFrom(autoSelectionBounds$),
    rx.map(([downEvent, selectionBounds]) => ({
      downEvent: downEvent.event,
      startPoint: downEvent.point,
      shape: downEvent.node,
      selectionBounds,
    })),
    rx.filter(({ shape, startPoint, selectionBounds }) => isValidShapeInteraction({ shape, startPoint, selectionBounds })),
    rx.tap(() => {
      console.log("ASD")
    })
  )),

  rx.switchMap(({ downEvent, shape, startPoint }) => {
    const startPointInScreen = getPointFromEvent(downEvent)

    const sharedMove$ = pointerMove$.pipe(rx.takeWhile((event) => !event.shiftKey), rx.share())

    const waitForThreshold$ = sharedMove$.pipe(
      rx.filter((event) => !event.ctrlKey && !event.shiftKey),
      rx.filter((event) => distance(startPointInScreen, getPointFromEvent(event)) >= 8),
      rx.take(1),
      rx.withLatestFrom(viewState$.pipe(rx.filter(isIdle))),
      rx.tap(([_, idleState]) => {
        if (!idleState.selectedIds.has(shape.id)) {
          viewState$.next(goToShapesDragging({
            needToDeselect: idleState.selectedIds.size === 0,
            selectedIds: new Set([shape.id]),
            startPoint: startPoint
          }))
        }
      }),
      rx.takeUntil(rx.merge(pointerUp$, pointerLeave$, wheel$))
    )

    const drag$ = waitForThreshold$.pipe(
      rx.withLatestFrom(camera$, shapes$),
      rx.switchMap(([_, camera, shapes]) => sharedMove$.pipe(
        rx.skip(1),
        rx.map((event) => mapPointerMoveToMovedShapes({ startPoint, camera, shapes, event })),
        rx.takeUntil(rx.merge(pointerUp$, pointerLeave$, wheel$)),
      ))
    )

    const finish$ = rx.merge(pointerUp$, pointerLeave$, wheel$).pipe(
      rx.take(1),
      // rx.tap(() => viewState$.next(goToIdle())),
      rx.ignoreElements()
    )

    return rx.merge(drag$, finish$)
  })
)

shapesDraggingFlow$.subscribe(shapes$)