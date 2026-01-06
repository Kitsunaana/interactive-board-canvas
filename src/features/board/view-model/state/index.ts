import { isRight, matchEither } from "@/shared/lib/either.ts";
import { match } from "@/shared/lib/match.ts";
import { isRectIntersectionV2 } from "@/shared/lib/rect.ts";
import { isNil } from "lodash";
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
import { endMoveSticker, movingSticker, startStickerMove } from "./idle/moving.ts";
import { getRectBySelectedNodes, stickerSelection } from "./idle/selection.ts";
import { goToIdle, type ViewModel, type ViewModelState } from "./type.ts";

export const viewModelState$ = new BehaviorSubject<ViewModelState>(goToIdle())

export const viewModel$ = combineLatest([viewModelState$, nodes$]).pipe(
  map(([state, nodes]) => match(state, {
    idle: (idleState): ViewModel => ({
      actions: {},
      nodes: nodes.map((node): StickerToView => ({
        ...node,
        isSelected: idleState.selectedIds.has(node.id),
      })),
    }),
  })),
  shareReplay({ bufferSize: 1, refCount: true })
)

export const selectedRect$ = combineLatest([nodes$, viewModelState$])
  .pipe(
    map(([nodes, { selectedIds }]) => getRectBySelectedNodes({ selectedIds, nodes })),
    shareReplay({ bufferSize: 1, refCount: true })
  )

export const nodesToRecord$ = nodes$.pipe(
  distinctUntilChanged((prev, current) => current.length === prev.length),
  map((nodes) => Object.fromEntries(nodes.map(node => ([node.id, node])))),
)

mouseUp$.pipe(
  filter(({ event }) => event.button === 0),
  withLatestFrom(viewModelState$),
  map(([upEvent, state]) => ({ ...upEvent, state })),
  switchMap(({ node, point, event, state }) => match(state, {
    __other: () => of(state),
    idle: (idleState) => match(node, {
      grid: () => of(null).pipe(
        withLatestFrom(selectedRect$),
        map(([_, selectedRect]) => matchEither(selectedRect, {
          right: (rect) => isRectIntersectionV2({ point, rect }) ? idleState : goToIdle(),
          left: () => goToIdle(),
        }))
      ),

      sticker: (sticker) => of(sticker).pipe(
        withLatestFrom(nodesToRecord$),
        map(([node, nodesRecord]) => nodesRecord[node.id]?.id),
        filter((nodeId) => !isNil(nodeId)),
        map((nodeId) => stickerSelection({ idleState, event, nodeId }))
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
    __other: () => EMPTY,
    idle: () => {
      const sharedMove$ = pointerMove$.pipe(share(), takeWhile((event) => !event.shiftKey))

      return merge(
        sharedMove$.pipe(
          take(1),
          tap(() => match(node, {
            sticker: (sticker) => viewModelState$.next(startStickerMove({ event, point, sticker })),
          })),
          ignoreElements(),
          takeUntil(merge(pointerUp$, wheel$))
        ),

        sharedMove$.pipe(
          skip(1),
          map((event) => movingSticker({ event, point, stickers, camera })),
          takeUntil(merge(pointerUp$, wheel$))
        ),

        sharedMove$.pipe(
          takeUntil(merge(pointerUp$, wheel$)),
          ignoreElements(),
          finalize(() => viewModelState$.next(endMoveSticker()))
        ),
      )
    }
  }))
).subscribe(nodes$)

