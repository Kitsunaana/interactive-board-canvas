import { isEqual, isNull } from "lodash"
import {
  animationFrames,
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  startWith,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
  withLatestFrom
} from "rxjs"
import { nodes$ } from "../../nodes"
import { centerPointFromRect, subtractPoint } from "../../point"
import { renderLoop$ } from "../../render-loop"
import { resize$ } from "../../setup"
import type { Rect } from "../../type"
import { _u, isNegative } from "../../utils"
import { cameraSubject$ } from "../camera"
import {
  calculateUnscaleMap,
  canMoveMiniMapViewportRect,
  computeMiniMapCameraRect,
  findLimitMapPoints,
  fromMiniMapToCameraPosition,
  getInitialClickedWorldPoint,
  getMiniMapPointerContext,
  moveCameraToClickedPoint,
  updateCameraWithAnimation,
  updateMiniMapSizes
} from "./core"
import { scaleRect, type MiniMapState, type MiniMapStateReady } from "./domain"

export const miniMapCameraSubject$ = new BehaviorSubject<Rect>({
  height: 0,
  width: 0,
  x: 0,
  y: 0,
})

export const miniMapProperties$ = new BehaviorSubject<MiniMapState>({
  canView: false,
  context: null,
  canvas: null
})

export const readyMiniMapSubject$ = miniMapProperties$.pipe(
  filter((state): state is MiniMapStateReady => !isNull(state.canvas) || !isNull(state.context) || state.canView),
  distinctUntilChanged(
    (prev, current) => prev.canvas === current.canvas
  ),
)

export const miniMapSizes$ = combineLatest([
  resize$.pipe(map(updateMiniMapSizes), startWith(updateMiniMapSizes())),
  readyMiniMapSubject$
]).pipe(
  map(([sizes, readyMap]) => ({ sizes, readyMap })),
  distinctUntilChanged(
    (prev, current) => isEqual(prev.sizes, current.sizes)
  ),
  map(({ sizes }) => sizes),
)

miniMapSizes$.pipe(
  withLatestFrom(readyMiniMapSubject$),
  tap(([sizes, { canvas }]) => {
    Object.assign(canvas, sizes)
  })
).subscribe()

export const findLimitMapPoints$ = combineLatest([miniMapSizes$, nodes$]).pipe(
  map(([miniMapSizes, nodes]) => findLimitMapPoints({
    miniMapSizes,
    nodes,
  }))
)

export const movedUnscaleNodes$ = findLimitMapPoints$.pipe(
  withLatestFrom(nodes$),
  map(([{ min }, nodes]) => (
    nodes.map((node) => ({
      ...node,
      x: isNegative(min.x) ? node.x + Math.abs(min.x) : node.x - min.x,
      y: isNegative(min.y) ? node.y + Math.abs(min.y) : node.y - min.y,
    }))
  ))
)

export const computeUnscaleMap$ = movedUnscaleNodes$.pipe(
  withLatestFrom(miniMapSizes$),
  map(([nodes, miniMapSizes]) => calculateUnscaleMap({
    miniMapSizes,
    nodes,
  }))
)

export const getMiniMapRenderLoop = (renderLoop: typeof renderLoop$) => (
  renderLoop.pipe(
    withLatestFrom(
      computeUnscaleMap$, findLimitMapPoints$, movedUnscaleNodes$, miniMapSizes$, readyMiniMapSubject$
    ),
    map(([cameraState, unscaleMap, limitMapPoints, unscaledNodes, miniMapSizes, readyMiniMap]) => {
      return ({
        ...readyMiniMap,
        ...cameraState,
        limitMapPoints,
        unscaledNodes,
        miniMapSizes,
        unscaleMap,
      })
    }))
)

combineLatest([cameraSubject$, findLimitMapPoints$]).pipe(
  map(([{ camera }, limitMapPoints]) => computeMiniMapCameraRect({
    limitMapPoints,
    camera,
  })))
  .subscribe(miniMapCameraSubject$)

readyMiniMapSubject$.pipe(switchMap(({ canvas }) => {
  const pointerLeave$ = fromEvent<PointerEvent>(canvas, "pointerleave")
  const pointerDown$ = fromEvent<PointerEvent>(canvas, "pointerdown")
  const pointerMove$ = fromEvent<PointerEvent>(canvas, "pointermove")
  const pointerUp$ = fromEvent<PointerEvent>(canvas, "pointerup")

  return pointerDown$.pipe(
    filter((downEvent) => downEvent.button !== 0),
    withLatestFrom(computeUnscaleMap$, miniMapCameraSubject$, cameraSubject$, findLimitMapPoints$),
    filter(([downEvent, unscaleMap, miniMapCamera]) => canMoveMiniMapViewportRect({
      miniMapCamera,
      unscaleMap,
      downEvent,
    })),
    switchMap(([downEvent, unscaleMap, _, initialCameraState, limitMapPoints]) => {
      const initialClickedWorldPoint = getInitialClickedWorldPoint({
        limitMapPoints,
        unscaleMap,
        downEvent,
      })

      return pointerMove$.pipe(
        withLatestFrom(computeUnscaleMap$, findLimitMapPoints$),
        takeUntil(merge(pointerUp$, pointerLeave$)),
        map(([moveEvent, currentUnscaleMap, currentLimitMapPoints]) => (
          fromMiniMapToCameraPosition({
            initialClickedWorldPoint,
            currentLimitMapPoints,
            initialCameraState,
            currentUnscaleMap,
            moveEvent
          })
        )),
      )
    })
  )
})).subscribe(cameraSubject$)

readyMiniMapSubject$.pipe(switchMap(({ canvas }) => {
  const pointerLeave$ = fromEvent<PointerEvent>(canvas, "pointerleave")
  const pointerDown$ = fromEvent<PointerEvent>(canvas, "pointerdown")
  const pointerMove$ = fromEvent<PointerEvent>(canvas, "pointermove")
  const pointerUp$ = fromEvent<PointerEvent>(canvas, "pointerup")

  return pointerDown$.pipe(
    filter((downEvent) => downEvent.button !== 1),
    withLatestFrom(miniMapCameraSubject$, computeUnscaleMap$),
    map(([pointerEvent, miniMapCamera, unscaleMap]) => getMiniMapPointerContext({
      miniMapCamera,
      pointerEvent,
      unscaleMap,
    })),
    switchMap((miniMapDownPointerContext) => {
      const miniMapPointerContext$ = pointerMove$.pipe(
        withLatestFrom(miniMapCameraSubject$, computeUnscaleMap$),
        map(([pointerEvent, miniMapCamera, unscaleMap]) => getMiniMapPointerContext({
          miniMapCamera,
          pointerEvent,
          unscaleMap
        })),
        takeWhile(({ pointInViewportRect }) => !pointInViewportRect),
        startWith(miniMapDownPointerContext)
      )

      return animationFrames().pipe(
        takeUntil(merge(pointerUp$, pointerLeave$)),
        withLatestFrom(cameraSubject$, miniMapCameraSubject$, computeUnscaleMap$, miniMapPointerContext$),
        map(([{ elapsed }, cameraState, miniMapCamera, unscaleMap, { pointInMiniMap }]) => ({
          pointInMiniMap,
          miniMapCamera,
          cameraState,
          unscaleMap,
          elapsed,
        })),

        map((params) => {
          const viewportRectToCenter = centerPointFromRect(scaleRect(params.miniMapCamera, params.unscaleMap))
          const displacement = subtractPoint(viewportRectToCenter, params.pointInMiniMap)
          const speed = params.elapsed / 100

          return _u.merge(params, { displacement, speed })
        }),

        takeWhile(({ speed, displacement }) => !(speed > Math.abs(displacement.x) && speed > Math.abs(displacement.y))),

        map(updateCameraWithAnimation)
      )
    })
  )
})).subscribe(cameraSubject$)

readyMiniMapSubject$.pipe(switchMap(({ canvas }) => {
  const pointerDown$ = fromEvent<PointerEvent>(canvas, "pointerdown")

  return pointerDown$.pipe(
    filter((downEvent) => downEvent.ctrlKey && downEvent.button === 0),
    withLatestFrom(miniMapCameraSubject$, computeUnscaleMap$, cameraSubject$),
    map(([downEvent, miniMapCamera, unscaleMap, cameraState]) => (
      moveCameraToClickedPoint({
        ...getMiniMapPointerContext({ pointerEvent: downEvent, miniMapCamera, unscaleMap }),
        cameraState,
        unscaleMap,
      })
    )))
})).subscribe(cameraSubject$)