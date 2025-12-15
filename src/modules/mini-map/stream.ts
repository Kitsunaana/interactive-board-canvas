import { BehaviorSubject, combineLatest, distinctUntilChanged, map, startWith, tap, withLatestFrom } from "rxjs"
import { renderLoop$ } from "../../render-loop"
import { resize$ } from "../../setup"
import { isNegative } from "../../utils"
import { MINI_MAP_SIZES, NODES } from "./const"
import { calculateUnscaleMap, canvas, findLimitMapPointsV2, updateMiniMapSizes } from "./core"
import { isEqual } from "lodash"

export const nodes$ = new BehaviorSubject(NODES)

export const miniMapSizes$ = resize$.pipe(
    map(updateMiniMapSizes),
    startWith(MINI_MAP_SIZES),
    distinctUntilChanged(isEqual),
    tap((state) => Object.assign(canvas, state))
)

export const findLimitMapPoints$ = combineLatest([miniMapSizes$, nodes$]).pipe(
    map(([miniMapSizes, nodes]) => findLimitMapPointsV2({
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
        map(([{ camera }, unscaleMap, limitMapPoints, unscaledNodes, miniMapSizes]) => ({
            limitMapPoints,
            unscaledNodes,
            miniMapSizes,
            unscaleMap,
            camera,
        })))
)