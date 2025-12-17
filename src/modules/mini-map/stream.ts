import { isEqual } from "lodash"
import {
    BehaviorSubject,
    combineLatest,
    distinctUntilChanged,
    filter,
    fromEvent,
    map,
    Observable,
    startWith,
    switchMap,
    takeUntil,
    tap,
    withLatestFrom
} from "rxjs"
import { renderLoop$ } from "../../render-loop"
import { resize$ } from "../../setup"
import type { Rect, Sizes } from "../../type"
import { isNegative } from "../../utils"
import { cameraSubject$ } from "../camera"
import { MINI_MAP_SIZES, NODES } from "./const"
import {
    calculateUnscaleMap,
    canMoveMiniMapViewportRect,
    canvas,
    computeMiniMapCameraRect,
    findLimitMapPoints,
    fromMiniMapToCameraPoisiton,
    getInitialClickedWorldPoint,
    isHtmlElement,
    updateMiniMapSizes
} from "./core"

export const nodes$ = new BehaviorSubject(NODES)

export const miniMapCameraSubject$ = new BehaviorSubject<Rect>({
    height: 0,
    width: 0,
    x: 0,
    y: 0,
})

export const miniMapSizes$: Observable<Sizes> = resize$.pipe(
    map(updateMiniMapSizes),
    startWith(MINI_MAP_SIZES),
    distinctUntilChanged(isEqual),
    tap((state) => Object.assign(canvas, state))
)

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
        withLatestFrom(computeUnscaleMap$, findLimitMapPoints$, movedUnscaleNodes$, miniMapSizes$),
        map(([cameraState, unscaleMap, limitMapPoints, unscaledNodes, miniMapSizes]) => ({
            ...cameraState,
            limitMapPoints,
            unscaledNodes,
            miniMapSizes,
            unscaleMap,
        })))
)

combineLatest([cameraSubject$, findLimitMapPoints$]).pipe(
    map(([{ camera }, limitMapPoints]) => computeMiniMapCameraRect({
        limitMapPoints,
        camera,
    })))
    .subscribe(miniMapCameraSubject$)

const mouseDown$ = fromEvent<PointerEvent>(canvas, "pointerdown")
const mouseMove$ = fromEvent<PointerEvent>(canvas, "pointermove")
const mouseUp$ = fromEvent<PointerEvent>(canvas, "pointerup")

mouseDown$.pipe(
    withLatestFrom(computeUnscaleMap$, miniMapCameraSubject$, cameraSubject$, findLimitMapPoints$),
    filter(([downEvent, unscaleMap, miniMapCamera]) => canMoveMiniMapViewportRect({
        miniMapCamera,
        unscaleMap,
        downEvent,
    })),
    switchMap(([downEvent, unscaleMap, _, initialCameraState, limitMapPoints]) => {
        if (!isHtmlElement(downEvent.target)) return []

        const initialClickedWorldPoint = getInitialClickedWorldPoint({ downEvent, limitMapPoints, unscaleMap })

        return mouseMove$.pipe(
            withLatestFrom(computeUnscaleMap$, findLimitMapPoints$),
            map(([moveEvent, currentUnscaleMap, currentLimitMapPoints]) => {
                if (!isHtmlElement(moveEvent.target)) return initialCameraState

                return fromMiniMapToCameraPoisiton({
                    initialClickedWorldPoint,
                    currentLimitMapPoints,
                    initialCameraState,
                    currentUnscaleMap,
                    moveEvent
                })
            }),
            takeUntil(mouseUp$)
        )
    })
).subscribe(cameraSubject$)
