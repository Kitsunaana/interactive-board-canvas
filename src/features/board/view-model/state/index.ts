import { matchEither } from "@/shared/lib/either.ts";
import { match } from "@/shared/lib/match.ts";
import { isRectIntersectionV2 } from "@/shared/lib/rect.ts";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  ignoreElements,
  map,
  merge,
  of,
  share,
  shareReplay,
  skip,
  switchMap,
  take,
  takeUntil,
  takeWhile,
  tap,
  withLatestFrom
} from "rxjs";
import { nodes$ } from "../../domain/node.ts";
import { isSticker, type StickerToView } from "../../domain/sticker.ts";
import { camera$ } from "../../modules/_camera/_stream.ts";
import { mouseDown$, mouseUp$, pointerMove$, pointerUp$, wheel$ } from "../../modules/_pick-node";
import { pointerLeave$ } from "../../modules/_pick-node/_events.ts";
import { endMoveSticker, movingSticker, startMoveSticker } from "./idle/moving.ts";
import { getRectBySelectedNodes, stickerSelection } from "./idle/selection.ts";
import type { ViewModel, ViewModelState } from "./type.ts";
import { goToIdle, goToNodesDragging, } from "./type.ts";

export const viewModelState$ = new BehaviorSubject<ViewModelState>(goToIdle())

export const viewModel$ = combineLatest([viewModelState$, nodes$]).pipe(
  map(([state, nodes]) => match(state, {
    nodesDragging: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node): StickerToView => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      })),
    }),
    idle: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node): StickerToView => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      })),
    }),
  })),
  shareReplay({ bufferSize: 1, refCount: true })
)

export const selectedRect$ = combineLatest([nodes$, viewModelState$]).pipe(
  map(([nodes, { selectedIds }]) => getRectBySelectedNodes({ selectedIds, stickers: nodes })),
  shareReplay({ bufferSize: 1, refCount: true })
)

export const nodesToRecord$ = nodes$.pipe(
  distinctUntilChanged((prev, current) => current.length === prev.length),
  map((nodes) => Object.fromEntries(nodes.map(node => ([node.id, node])))),
)

mouseUp$.pipe(
  filter(({ event }) => !event.shiftKey && event.button === 0),
  withLatestFrom(viewModelState$),
  map(([upEvent, state]) => ({ ...upEvent, state })),
  switchMap(({ node, event, state }) => match(state, {
    nodesDragging: (state) => of(state.needToDeselect ? goToIdle() : state),

    idle: (idleState) => match(node, {
      grid: () => of(null).pipe(map(() => goToIdle())),

      sticker: (sticker) => of(sticker).pipe(
        map(() => stickerSelection({ idleState, stickerId: sticker.id, event }))
      ),
    }),
  })),
).subscribe(viewModelState$)

mouseDown$.pipe(
  filter(({ event }) => event.button === 0),
  withLatestFrom(nodes$, camera$, viewModelState$, selectedRect$),
  map(([downEvent, stickers, camera, state, selectedRect]) => ({ ...downEvent, selectedRect, stickers, camera, state })),
  filter(({ node, point, selectedRect }) => matchEither(selectedRect, {
    right: (rect) => isSticker(node) || isRectIntersectionV2({ point, rect }),
    left: () => isSticker(node),
  })),
  switchMap(({ camera, event, node, stickers, point, state }) => match(state, {
    nodesDragging: () => EMPTY,

    idle: (idleState) => {
      const sharedMove$ = pointerMove$.pipe(share(), takeWhile((event) => !event.shiftKey))

      return merge(
        sharedMove$.pipe(
          take(1),
          tap(() => {
            const needToDeselect = idleState.selectedIds.size === 0

            viewModelState$.next(goToNodesDragging({
              selectedIds: idleState.selectedIds,
              needToDeselect,
            }))

            match(node, {
              sticker: (sticker) => viewModelState$.next(startMoveSticker({ event, point, sticker })),
              grid: () => { },
            })
          }),
          ignoreElements(),
          takeUntil(merge(pointerUp$, pointerLeave$, wheel$))
        ),

        sharedMove$.pipe(
          skip(1),
          map((event) => movingSticker({ event, point, stickers, camera })),
          takeUntil(merge(pointerUp$, pointerLeave$, wheel$))
        ),

        sharedMove$.pipe(
          takeUntil(merge(pointerUp$, pointerLeave$, wheel$)),
          ignoreElements(),
          finalize(() => viewModelState$.next(endMoveSticker()))
        ),
      )
    }
  }))
).subscribe(nodes$)

