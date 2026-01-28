import { getBoundingBox } from "@/entities/shape/model/get-bounding-box";
import { resize$ } from "@/shared/lib/initial-canvas";
import { getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point";
import { calculateLimitPointsFromRects, centerPointFromRect, unscaleRect } from "@/shared/lib/rect";
import { _u, getBoundingClientRect, isNotNull } from "@/shared/lib/utils";
import type { Point, Rect } from "@/shared/type/shared";
import * as _ from "lodash";
import * as rx from "rxjs";
import { shapes$ } from "../../model/shapes";
import { cameraSubject$, type Camera } from "../camera";
import {
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
import { drawMiniMap } from "./_ui";

export const miniMapCameraSubject$ = new rx.BehaviorSubject<Rect>({
  height: 0,
  width: 0,
  x: 0,
  y: 0,
})

export const miniMapProperties$ = new rx.BehaviorSubject<MiniMapState>({
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

export const readyMiniMap = (instance: HTMLCanvasElement | null) => {
  if (!_.isNil(instance)) {
    miniMapProperties$.next({
      context: instance.getContext("2d"),
      canvas: instance,
      isShow: true,
    })
  }
}

export const readyMiniMapSubject$ = miniMapProperties$.pipe(
  rx.filter((state): state is MiniMapStateReady => isNotNull(state.canvas) || isNotNull(state.context)),
)

export const miniMapSizes$ = rx.combineLatest([
  resize$.pipe(rx.map(getUnscaledMiniMapSizes), rx.startWith(getUnscaledMiniMapSizes())),
  readyMiniMapSubject$
]).pipe(
  rx.map(([sizes, readyMap]) => ({ sizes, readyMap })),
  rx.distinctUntilChanged((prev, current) => _.isEqual(prev, current)),
  rx.map(({ sizes }) => sizes),
)

miniMapSizes$.pipe(
  rx.withLatestFrom(readyMiniMapSubject$),
  rx.tap(([sizes, { canvas }]) => Object.assign(canvas, sizes))
).subscribe()

export const findLimitMapPoints$ = rx.combineLatest([shapes$, miniMapSizes$]).pipe(
  rx.map(([rects]) => calculateLimitPointsFromRects({
    rects: rects.map(shape => getBoundingBox(shape.geometry, shape.transform.rotate))
  }))
)

export const movedUnscaleNodes$ = findLimitMapPoints$.pipe(
  rx.withLatestFrom(shapes$),
  rx.map(([{ min: _min }, nodes]) => (
    nodes.map((node) => ({
      ...node,
      // x: isNegative(min.x) ? node.x + Math.abs(min.x) : node.x,
      // y: isNegative(min.y) ? node.y + Math.abs(min.y) : node.y,
    }))
  ))
)

export const unscaleMap$ = movedUnscaleNodes$.pipe(
  rx.withLatestFrom(miniMapSizes$),
  rx.map(([rects, miniMapSizes]) => calculateUnscaleMap({
    miniMapSizes,
    rects: rects.map(shape => getBoundingBox(shape.geometry, shape.transform.rotate))
  })),
)

export const miniMapRenderer = rx.animationFrames().pipe(
  rx.withLatestFrom(readyMiniMapSubject$, miniMapSizes$, movedUnscaleNodes$, unscaleMap$, miniMapCameraSubject$),
  rx.map(([_, { context }, sizes, shapes, unscale, cameraRect]) => ({ context, sizes, shapes, unscale, cameraRect })),
  rx.tap(drawMiniMap)
)

miniMapRenderer.subscribe()

rx.combineLatest([cameraSubject$, findLimitMapPoints$])
  .pipe(rx.map(([{ camera }, limitMapPoints]) => calculateMiniMapCameraRect({ limitMapPoints, camera })))
  .subscribe(miniMapCameraSubject$)

export const fromMiniMapToCameraPosition$ = ({ worldPoint, camera, moveEvent }: {
  moveEvent: PointerEvent
  worldPoint: Point
  camera: Camera
}): rx.Observable<Camera> => rx.of(camera).pipe(
  rx.withLatestFrom(unscaleMap$, findLimitMapPoints$),
  rx.map(([camera, unscaleMap, limitMapPoints]) => {
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
  const pointerLeave$ = rx.fromEvent<PointerEvent>(element, "pointerleave")
  const pointerDown$ = rx.fromEvent<PointerEvent>(element, "pointerdown")
  const pointerMove$ = rx.fromEvent<PointerEvent>(element, "pointermove")
  const pointerUp$ = rx.fromEvent<PointerEvent>(element, "pointerup")

  return {
    pointerLeave$,
    pointerDown$,
    pointerMove$,
    pointerUp$,
  }
}

readyMiniMapSubject$.pipe(rx.switchMap(({ canvas }) => {
  const { pointerDown$, pointerLeave$, pointerMove$, pointerUp$ } = createEvents(canvas)

  return pointerDown$.pipe(
    rx.filter((downEvent) => downEvent.button !== 0),
    rx.withLatestFrom(unscaleMap$, miniMapCameraSubject$, findLimitMapPoints$, cameraSubject$),
    rx.map(([downEvent, unscaleMap, miniMapCamera, limitMapPoints, { camera, ...cameraState }]) => ({
      limitMapPoints, miniMapCamera, cameraState, unscaleMap, downEvent, camera,
    })),
    rx.filter(({ miniMapCamera, unscaleMap, downEvent }) => canMoveMiniMapViewportRect({ miniMapCamera, unscaleMap, downEvent })),
    rx.switchMap(({ limitMapPoints, unscaleMap, downEvent, camera, cameraState }) => {
      const worldPoint = getPointFromMiniMapToScreen({ limitMapPoints, unscaleMap, downEvent })

      return pointerMove$.pipe(
        rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
        rx.switchMap((moveEvent) => (
          fromMiniMapToCameraPosition$({ worldPoint, moveEvent, camera }).pipe(
            rx.map((camera) => _u.merge(cameraState, { camera }))
          )
        ))
      )
    })
  )
})).subscribe(cameraSubject$)

readyMiniMapSubject$.pipe(rx.switchMap(({ canvas }) => {
  const { pointerDown$, pointerLeave$, pointerMove$, pointerUp$ } = createEvents(canvas)

  return pointerDown$.pipe(
    rx.filter((downEvent) => downEvent.button !== 1 && downEvent.button !== 2),
    rx.withLatestFrom(miniMapCameraSubject$, unscaleMap$),
    rx.map(([pointerEvent, miniMapCamera, unscaleMap]) => getMiniMapPointerContext({ miniMapCamera, pointerEvent, unscaleMap })),
    rx.switchMap((miniMapDownPointerContext) => {
      const miniMapPointerContext$ = pointerMove$.pipe(
        rx.withLatestFrom(miniMapCameraSubject$, unscaleMap$),
        rx.map(([pointerEvent, miniMapCamera, unscaleMap]) => getMiniMapPointerContext({ miniMapCamera, pointerEvent, unscaleMap })),
        rx.takeWhile(({ pointInViewportRect }) => !pointInViewportRect),
        rx.startWith(miniMapDownPointerContext)
      )

      return rx.animationFrames().pipe(
        rx.takeUntil(rx.merge(pointerUp$, pointerLeave$)),
        rx.withLatestFrom(cameraSubject$, miniMapCameraSubject$, unscaleMap$, miniMapPointerContext$),
        rx.map(([{ elapsed }, cameraState, miniMapCamera, unscaleMap, { pointInMiniMap }]) => ({
          pointInMiniMap,
          miniMapCamera,
          cameraState,
          unscaleMap,
          elapsed,
        })),

        rx.map((params) => {
          const viewportRectToCenter = centerPointFromRect(unscaleRect(params.miniMapCamera, params.unscaleMap))
          const displacement = subtractPoint(viewportRectToCenter, params.pointInMiniMap)
          const speed = params.elapsed / 100

          return _u.merge(params, { displacement, speed })
        }),

        rx.takeWhile(({ speed, displacement }) => !(speed > Math.abs(displacement.x) && speed > Math.abs(displacement.y))),

        rx.map(updateCameraWithAnimation)
      )
    })
  )
})).subscribe(cameraSubject$)

readyMiniMapSubject$.pipe(rx.switchMap(({ canvas }) => {
  const { pointerDown$ } = createEvents(canvas)

  return pointerDown$.pipe(
    rx.filter((downEvent) => downEvent.ctrlKey && downEvent.button === 0),
    rx.withLatestFrom(miniMapCameraSubject$, unscaleMap$, cameraSubject$),
    rx.map(([downEvent, miniMapCamera, unscaleMap, cameraState]) => (
      moveCameraToClickedPoint({
        ...getMiniMapPointerContext({ pointerEvent: downEvent, miniMapCamera, unscaleMap }),
        cameraState,
        unscaleMap,
      })
    )))
})).subscribe(cameraSubject$)

