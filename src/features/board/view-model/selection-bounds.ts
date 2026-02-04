import * as rx from "rxjs";
import { computeSelectionBoundsArea } from "../domain/selection-area";
import type { HitResizeHandler } from "../modules/pick-node/_core";
import { selectedShapesIds$, shapesToRender$, viewState$ } from "./state";

export const pressedResizeHandlerSubject$ = new rx.BehaviorSubject<HitResizeHandler | null>(null)

const pointerMove$ = rx.fromEvent<PointerEvent>(window, "pointermove")
const pointerDown$ = rx.fromEvent<PointerEvent>(window, "pointerdown")
const pointerUp$ = rx.fromEvent<PointerEvent>(window, "pointerup")

const isDragging$ = rx.merge(pointerDown$.pipe(rx.map(() => true)), pointerUp$.pipe(rx.map(() => false))).pipe(
  rx.startWith(false),
  rx.distinctUntilChanged(),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

const isCtrlPressed$ = rx.merge(pointerMove$, pointerDown$, pointerUp$).pipe(
  rx.map(event => event.ctrlKey && !event.shiftKey),
  rx.startWith(false),
  rx.distinctUntilChanged(),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const autoSelectionBounds$ = rx.combineLatest({
  shapes: shapesToRender$,
  state: viewState$,
}).pipe(
  rx.map(({ shapes, state }) => computeSelectionBoundsArea(shapes, state)),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)


export const selectionBounds$ = rx.combineLatest({
  selectedIds: selectedShapesIds$,
  isDragging: isDragging$,
  isCtrl: isCtrlPressed$,
}).pipe(
  rx.switchMap(() => {

    return autoSelectionBounds$
  })
)