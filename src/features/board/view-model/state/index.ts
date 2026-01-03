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
  withLatestFrom
} from "rxjs";
import { nodes$ } from "../../domain/node.ts";
import type { StickerToView } from "../../domain/sticker.ts";
import { cameraSubject$ } from "../../modules/_camera/";
import { mouseDown$, mouseUp$, pointerMove$, pointerUp$, wheel$ } from "../../modules/_pick-node";
import { endMoveOneNode, movingOneNode, startMoveOneNode } from "./idle/moving.ts";
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
  withLatestFrom(viewModelState$),
  map(([upEvent, state]) => ({ ...upEvent, state })),
  map(({ node, event, state }) => match(state, {
    __other: () => state,
    idle: (idleState) => match(node, {
      sticker: () => stickerSelection({ idleState, event, node }),
      grid: () => goToIdle(),
    }),
  })),
).subscribe(viewModelState$)

mouseDown$.pipe(
  filter(({ event }) => event.button === 0),
  withLatestFrom(nodes$, cameraSubject$, viewModelState$),
  map(([downEvent, nodes, { camera }, state]) => ({ ...downEvent, nodes, camera, state })),
  switchMap(({ camera, event, node, nodes, point, state }) => match(state, {
    __other: () => EMPTY,
    idle: () => {
      const sharedMove$ = pointerMove$.pipe(share())

      return merge(
        sharedMove$.pipe(
          take(1),
          map(() => startMoveOneNode({ event, node, point, nodes })),
          takeUntil(merge(pointerUp$, wheel$))
        ),

        sharedMove$.pipe(
          skip(1),
          map((event) => movingOneNode({ event, point, nodes, camera })),
          takeUntil(merge(pointerUp$, wheel$))
        ),

        sharedMove$.pipe(
          takeUntil(merge(pointerUp$, wheel$)),
          ignoreElements(),
          finalize(() => endMoveOneNode({ nodes }))
        ),
      )
    }
  }))
).subscribe(nodes$)

