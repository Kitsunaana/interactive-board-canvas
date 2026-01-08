import { resize$ } from "@/shared/lib/initial-canvas";
import { getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point";
import { centerPointFromRect, unscaleRect } from "@/shared/lib/rect";
import { _u, getBoundingClientRect, isNegative, isNotNull } from "@/shared/lib/utils";
import type { Point, Rect } from "@/shared/type/shared";
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
  Observable,
  of,
  startWith,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
  withLatestFrom
} from "rxjs";
import { shapes$ } from "../../domain/node";
import { renderMiniMap } from "../../ui/mini-map";
import { cameraSubject$, type Camera } from "../_camera";
import {
  calculateLimitPoints,
  calculateMiniMapCameraRect,
  calculateUnscaleMap,
  canMoveMiniMapViewportRect,
  getMiniMapPointerContext,
  getPointFromMiniMapToScreen,
  getUnscaledMiniMapSizes,
  moveCameraToClickedPoint,
  updateCameraWithAnimation
} from "./_core";
import type { MiniMapState, MiniMapStateReady } from "./_domain";
import type { Shape } from "../../domain/dto";

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

export const findLimitMapPoints$ = combineLatest([shapes$, miniMapSizes$]).pipe(map(([rects]) => calculateLimitPoints({ rects })))

export const movedUnscaleNodes$ = findLimitMapPoints$.pipe(
  withLatestFrom(shapes$),
  map(([{ min }, nodes]) => (
    nodes.map((node) => ({
      ...node,
      x: isNegative(min.x) ? node.x + Math.abs(min.x) : node.x,
      y: isNegative(min.y) ? node.y + Math.abs(min.y) : node.y,
    }))
  ))
)

export const unscaleMap$ = movedUnscaleNodes$.pipe(
  withLatestFrom(miniMapSizes$),
  map(([rects, miniMapSizes]) => calculateUnscaleMap({ miniMapSizes, rects })),
)

export const miniMapRenderer = animationFrames().pipe(
  withLatestFrom(readyMiniMapSubject$, miniMapSizes$, movedUnscaleNodes$, unscaleMap$, miniMapCameraSubject$),
  map(([_, { context }, sizes, nodes, unscale, cameraRect]) => ({ context, sizes, nodes, unscale, cameraRect })),
  tap(renderMiniMap)
)

miniMapRenderer.subscribe()

combineLatest([cameraSubject$, findLimitMapPoints$])
  .pipe(map(([{ camera }, limitMapPoints]) => calculateMiniMapCameraRect({ limitMapPoints, camera })))
  .subscribe(miniMapCameraSubject$)

export const fromMiniMapToCameraPosition$ = ({ worldPoint, camera, moveEvent }: {
  moveEvent: PointerEvent
  worldPoint: Point
  camera: Camera
}): Observable<Camera> => of(camera).pipe(
  withLatestFrom(unscaleMap$, findLimitMapPoints$),
  map(([camera, unscaleMap, limitMapPoints]) => {
    const pointInScreen = getPointFromEvent(moveEvent)
    const viewportMiniMapRect = getBoundingClientRect(moveEvent)

    const pointInCanvas = screenToCanvas({
      camera: viewportMiniMapRect,
      point: pointInScreen,
    })

    const worldX = pointInCanvas.x * unscaleMap + limitMapPoints.min.x
    const worldY = pointInCanvas.y * unscaleMap + limitMapPoints.min.y

    const deltaWorldX = worldX - worldPoint.x
    const deltaWorldY = worldY - worldPoint.y

    return _u.merge(camera, {
      x: camera.x - deltaWorldX * camera.scale,
      y: camera.y - deltaWorldY * camera.scale,
    })
  })
)

const createEvents = (element: HTMLElement) => {
  const pointerLeave$ = fromEvent<PointerEvent>(element, "pointerleave")
  const pointerDown$ = fromEvent<PointerEvent>(element, "pointerdown")
  const pointerMove$ = fromEvent<PointerEvent>(element, "pointermove")
  const pointerUp$ = fromEvent<PointerEvent>(element, "pointerup")

  return {
    pointerLeave$,
    pointerDown$,
    pointerMove$,
    pointerUp$,
  }
}

readyMiniMapSubject$.pipe(switchMap(({ canvas }) => {
  const { pointerDown$, pointerLeave$, pointerMove$, pointerUp$ } = createEvents(canvas)

  return pointerDown$.pipe(
    filter((downEvent) => downEvent.button !== 0),
    withLatestFrom(unscaleMap$, miniMapCameraSubject$, findLimitMapPoints$, cameraSubject$),
    map(([downEvent, unscaleMap, miniMapCamera, limitMapPoints, { camera, ...cameraState }]) => ({
      limitMapPoints, miniMapCamera, cameraState, unscaleMap, downEvent, camera,
    })),
    filter(({ miniMapCamera, unscaleMap, downEvent }) => canMoveMiniMapViewportRect({ miniMapCamera, unscaleMap, downEvent })),
    switchMap(({ limitMapPoints, unscaleMap, downEvent, camera, cameraState }) => {
      const worldPoint = getPointFromMiniMapToScreen({ limitMapPoints, unscaleMap, downEvent })

      return pointerMove$.pipe(
        takeUntil(merge(pointerUp$, pointerLeave$)),
        switchMap((moveEvent) => (
          fromMiniMapToCameraPosition$({ worldPoint, moveEvent, camera }).pipe(
            map((camera) => _u.merge(cameraState, { camera }))
          )
        ))
      )
    })
  )
})).subscribe(cameraSubject$)

readyMiniMapSubject$.pipe(switchMap(({ canvas }) => {
  const { pointerDown$, pointerLeave$, pointerMove$, pointerUp$ } = createEvents(canvas)

  return pointerDown$.pipe(
    filter((downEvent) => downEvent.button !== 1 && downEvent.button !== 2),
    withLatestFrom(miniMapCameraSubject$, unscaleMap$),
    map(([pointerEvent, miniMapCamera, unscaleMap]) => getMiniMapPointerContext({ miniMapCamera, pointerEvent, unscaleMap })),
    switchMap((miniMapDownPointerContext) => {
      const miniMapPointerContext$ = pointerMove$.pipe(
        withLatestFrom(miniMapCameraSubject$, unscaleMap$),
        map(([pointerEvent, miniMapCamera, unscaleMap]) => getMiniMapPointerContext({ miniMapCamera, pointerEvent, unscaleMap })),
        takeWhile(({ pointInViewportRect }) => !pointInViewportRect),
        startWith(miniMapDownPointerContext)
      )

      return animationFrames().pipe(
        takeUntil(merge(pointerUp$, pointerLeave$)),
        withLatestFrom(cameraSubject$, miniMapCameraSubject$, unscaleMap$, miniMapPointerContext$),
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
  const { pointerDown$ } = createEvents(canvas)

  return pointerDown$.pipe(
    filter((downEvent) => downEvent.ctrlKey && downEvent.button === 0),
    withLatestFrom(miniMapCameraSubject$, unscaleMap$, cameraSubject$),
    map(([downEvent, miniMapCamera, unscaleMap, cameraState]) => (
      moveCameraToClickedPoint({
        ...getMiniMapPointerContext({ pointerEvent: downEvent, miniMapCamera, unscaleMap }),
        cameraState,
        unscaleMap,
      })
    )))
})).subscribe(cameraSubject$)

