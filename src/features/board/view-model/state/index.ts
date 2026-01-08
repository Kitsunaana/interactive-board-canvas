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
import type { ShapeToView } from "../../domain/dto.ts";
import { shapes$, shapesToView$ } from "../../domain/node.ts";
import { camera$ } from "../../modules/_camera/_stream.ts";
import { mouseDown$, mouseUp$, pointerMove$, pointerUp$, wheel$ } from "../../modules/_pick-node";
import { pointerLeave$ } from "../../modules/_pick-node/_events.ts";
import { endMoveSticker, movingSticker, startMoveSticker } from "./idle/moving.ts";
import { getRectBySelectedShapes, shapeSelect } from "./idle/selection.ts";
import type { ViewModel, ViewModelState } from "./type.ts";
import { goToIdle, goToNodesDragging, } from "./type.ts";

export const viewModelState$ = new BehaviorSubject<ViewModelState>(goToIdle())

export const viewModel$ = combineLatest([viewModelState$, shapesToView$]).pipe(
  map(([state, nodes]) => match(state, {
    nodesDragging: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node) => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      }) as ShapeToView),
    }),

    idle: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node) => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      }) as ShapeToView),
    }),
  })),
  shareReplay({ bufferSize: 1, refCount: true })
)

export const selectedRect$ = combineLatest([shapes$, viewModelState$]).pipe(
  map(([nodes, { selectedIds }]) => getRectBySelectedShapes({ selectedIds, shapes: nodes })),
  shareReplay({ bufferSize: 1, refCount: true })
)

export const nodesToRecord$ = shapes$.pipe(
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

      arrow: () => of(null).pipe(map(() => idleState)),

      circle: () => of(null).pipe(map(() => idleState)),

      square: () => of(null).pipe(map(() => idleState)),

      rectangle: ({ id: shapeId }) => of(null).pipe(
        map(() => shapeSelect({
          idleState,
          shapeId,
          event,
        }))
      ),
    }),
  })),
).subscribe(viewModelState$)

const isRectangle = <T extends { type: string }>(shape: T) => shape.type === "rectangle"

mouseDown$.pipe(
  filter(({ event }) => event.button === 0),
  withLatestFrom(shapes$, camera$, viewModelState$, selectedRect$),
  map(([downEvent, stickers, camera, state, selectedRect]) => ({ ...downEvent, selectedRect, stickers, camera, state })),
  filter(({ node, point, selectedRect }) => matchEither(selectedRect, {
    right: ({ main }) => isRectangle(node) || isRectIntersectionV2({ point, rect: main }),
    left: () => isRectangle(node),
  })),
  switchMap(({ camera, event, node, stickers, point, state }) => match(state, {
    nodesDragging: () => EMPTY,

    idle: (idleState) => {
      const sharedMove$ = pointerMove$.pipe(share(), takeWhile((event) => !event.shiftKey))

      return merge(
        sharedMove$.pipe(
          take(1),
          tap(() => {
            viewModelState$.next(goToNodesDragging({
              needToDeselect: idleState.selectedIds.size === 0,
              selectedIds: idleState.selectedIds,
            }))

            match(node, {
              grid: () => {},
              arrow: () => {},
              circle: () => {},
              square: () => {},
              rectangle: (shape) => viewModelState$.next(startMoveSticker({ event, point, shape })),
            })
          }),
          ignoreElements(),
          takeUntil(merge(pointerUp$, pointerLeave$, wheel$))
        ),

        sharedMove$.pipe(
          skip(1),
          map((event) => movingSticker({ event, point, shapes: stickers, camera })),
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
).subscribe(shapes$)

