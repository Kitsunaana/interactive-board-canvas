import { match } from "@/shared/lib/match.ts";
import {
  BehaviorSubject,
  combineLatest,
  EMPTY,
  filter,
  finalize,
  ignoreElements,
  map,
  merge,
  share,
  shareReplay,
  skip,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from "rxjs";
import { nodes$ } from "../../domain/node.ts";
import type { StickerToView } from "../../domain/sticker.ts";
import { cameraSubject$ } from "../../modules/_camera";
import { mouseDown$, mouseUp$, pointerMove$, pointerUp$, wheel$ } from "../../modules/_pick-node";
import { endMoveSticker, movingSticker, startStickerMove } from "./idle/moving.ts";
import { stickerSelection } from "./idle/selection.ts";
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

mouseUp$.pipe(
  filter(({ event }) => event.button === 0),
  withLatestFrom(viewModelState$, viewModel$),
  map(([upEvent, state, viewModel]) => ({ ...upEvent, state, viewModel })),
  map(({ node, event, state, viewModel }) => match(state, {
    __other: () => state,
    idle: (idleState) => match(node, {
      grid: () => goToIdle(),
      sticker: (sticker) => {
        const node = viewModel.nodes.find(({ id }) => sticker.id === id) as StickerToView

        return stickerSelection({ idleState, event, node })
      },
    }),
  })),
).subscribe(viewModelState$)

mouseDown$.pipe(
  filter(({ event }) => event.button === 0),
  withLatestFrom(nodes$, cameraSubject$, viewModelState$),
  map(([downEvent, stickers, { camera }, state]) => ({ ...downEvent, stickers, camera, state })),
  switchMap(({ camera, event, node, stickers, point, state }) => match(state, {
    __other: () => EMPTY,
    idle: () => {
      const sharedMove$ = pointerMove$.pipe(share())

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

