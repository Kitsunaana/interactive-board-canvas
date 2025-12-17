import { isEqual, isNull } from "lodash"
import {
    BehaviorSubject,
    combineLatest,
    distinctUntilChanged,
    filter,
    fromEvent,
    map,
    startWith,
    switchMap,
    takeUntil,
    tap,
    withLatestFrom
} from "rxjs"
import { renderLoop$ } from "../../render-loop"
import { resize$ } from "../../setup"
import type { Rect } from "../../type"
import { isNegative } from "../../utils"
import { cameraSubject$ } from "../camera"
import { NODES } from "./const"
import {
    calculateUnscaleMap,
    canMoveMiniMapViewportRect,
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

type MiniMapState = {
    context: CanvasRenderingContext2D | null
    canvas: HTMLCanvasElement | null
    canView: boolean
}

type MiniMapStateReady = MiniMapState & {
    context: CanvasRenderingContext2D
    canvas: HTMLCanvasElement
}

export const miniMapProperties$ = new BehaviorSubject<MiniMapState>({
    canView: false,
    context: null,
    canvas: null
})

export const readyMiniMapSubject$ = miniMapProperties$.pipe(
    filter((state): state is MiniMapStateReady => !isNull(state.canvas) || !isNull(state.context) || state.canView),
    distinctUntilChanged((prev, current) => prev.canvas === current.canvas),
)

export const miniMapSizes$ = combineLatest([
    resize$.pipe(map(updateMiniMapSizes), startWith(updateMiniMapSizes())), 
    readyMiniMapSubject$
]).pipe(
    map(([sizes, readyMap]) => ({ sizes, readyMap })),
    distinctUntilChanged((prev, current) => isEqual(prev, current)),
    tap(({ readyMap, sizes }) => Object.assign(readyMap.canvas, sizes)),
    map(({ sizes }) => sizes),
)

miniMapSizes$.subscribe(s => console.log(s)) // Выводится

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
        withLatestFrom(computeUnscaleMap$, findLimitMapPoints$, movedUnscaleNodes$, miniMapSizes$, readyMiniMapSubject$),
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

readyMiniMapSubject$.pipe(
    switchMap(({ canvas }) => {
        const mouseDown$ = fromEvent<PointerEvent>(canvas, "pointerdown")
        const mouseMove$ = fromEvent<PointerEvent>(canvas, "pointermove")
        const mouseUp$ = fromEvent<PointerEvent>(canvas, "pointerup")

        return mouseDown$.pipe(
            withLatestFrom(computeUnscaleMap$, miniMapCameraSubject$, cameraSubject$, findLimitMapPoints$),
            filter(([downEvent, unscaleMap, miniMapCamera]) => canMoveMiniMapViewportRect({
                miniMapCamera,
                unscaleMap,
                downEvent,
            })),
            switchMap(([downEvent, unscaleMap, _, initialCameraState, limitMapPoints]) => {
                if (!isHtmlElement(downEvent.target)) return []

                const initialClickedWorldPoint = getInitialClickedWorldPoint({
                    limitMapPoints,
                    unscaleMap,
                    downEvent,
                })

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
        )
    })
).subscribe(cameraSubject$)

