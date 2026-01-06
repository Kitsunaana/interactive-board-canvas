import { resize$ } from "@/shared/lib/initial-canvas";
import { subtractPoint } from "@/shared/lib/point";
import { centerPointFromRect, unscaleRect } from "@/shared/lib/rect";
import { _u, isNegative, isNotNull } from "@/shared/lib/utils";
import type { Rect } from "@/shared/type/shared";
import { isEqual } from "lodash";
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
} from "rxjs";
import type { renderLoop$ } from "src/render-loop";
import { nodes$ } from "../../domain/node";
import { renderMiniMapV2 } from "../../ui/mini-map";
import { cameraSubject$ } from "../_camera";
import {
  calculateUnscaleMap,
  canMoveMiniMapViewportRect,
  calculateLimitPoints,
  calculateMiniMapCameraRect,
  fromMiniMapToCameraPosition,
  getPointFromMiniMapToScreen,
  getMiniMapPointerContext,
  moveCameraToClickedPoint,
  updateCameraWithAnimation,
  getUnscaledMiniMapSizes
} from "./_core";
import type { MiniMapState, MiniMapStateReady } from "./_domain";

export const miniMapCameraSubject$ = new BehaviorSubject<Rect>({
  height: 0,
  width: 0,
  x: 0,
  y: 0,
})

export const miniMapProperties$ = new BehaviorSubject<MiniMapState>({
  context: null,
  canvas: null,
  isShow: true,
})

export const toggleShowMiniMap = () => {
  const current = miniMapProperties$.getValue()

  miniMapProperties$.next({
    ...current,
    isShow: !current.isShow,
  })
}

export const readyMiniMapSubject$ = miniMapProperties$.pipe(
  filter((state): state is MiniMapStateReady => isNotNull(state.canvas) || isNotNull(state.context)),
)

export const miniMapSizes$ = combineLatest([
  resize$.pipe(map(getUnscaledMiniMapSizes), startWith(getUnscaledMiniMapSizes())),
  readyMiniMapSubject$
]).pipe(
  map(([sizes, readyMap]) => ({ sizes, readyMap })),
  distinctUntilChanged((prev, current) => isEqual(prev, current)),
  map(({ sizes }) => sizes),
)

miniMapSizes$.pipe(
  withLatestFrom(readyMiniMapSubject$),
  tap(([sizes, { canvas }]) => Object.assign(canvas, sizes))
).subscribe()

export const findLimitMapPoints$ = combineLatest([nodes$, miniMapSizes$]).pipe(map(([rects]) => calculateLimitPoints({ rects })))

export const movedUnscaleNodes$ = findLimitMapPoints$.pipe(
  withLatestFrom(nodes$),
  map(([{ min }, nodes]) => (
    nodes.map((node) => ({
      ...node,
      x: isNegative(min.x) ? node.x + Math.abs(min.x) : node.x,
      y: isNegative(min.y) ? node.y + Math.abs(min.y) : node.y,
    }))
  ))
)

export const computeUnscaleMap$ = movedUnscaleNodes$.pipe(
  withLatestFrom(miniMapSizes$),
  map(([rects, miniMapSizes]) => calculateUnscaleMap({ miniMapSizes, rects })),
)

export const miniMapRenderer = animationFrames().pipe(
  withLatestFrom(readyMiniMapSubject$, miniMapSizes$, movedUnscaleNodes$, computeUnscaleMap$, miniMapCameraSubject$),
  map(([_, { context }, sizes, nodes, unscale, cameraRect]) => ({ context, sizes, nodes, unscale, cameraRect })),
  tap(renderMiniMapV2)
)

miniMapRenderer.subscribe()

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
  map(([{ camera }, limitMapPoints]) => calculateMiniMapCameraRect({ limitMapPoints, camera }))
)
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
      const initialClickedWorldPoint = getPointFromMiniMapToScreen({
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
    filter((downEvent) => downEvent.button !== 1 && downEvent.button !== 2),
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
          const viewportRectToCenter = centerPointFromRect(unscaleRect(params.miniMapCamera, params.unscaleMap))
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

