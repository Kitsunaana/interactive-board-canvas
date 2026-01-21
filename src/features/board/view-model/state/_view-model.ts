import { match } from "@/shared/lib/match.ts";
import { _u, isNotUndefined } from "@/shared/lib/utils.ts";
import { isEqual, isUndefined, pick } from "lodash";
import * as rx from "rxjs";
import type { Shape, ShapeToView } from "../../domain/shape.ts";
import { shapes$ } from "../../model/index.ts";
import { generateEllipseSketchProps, generateRectangleSketchProps } from "../shape-sketch.ts";
import type { ViewModel, ViewModelState } from "./_view-model.type.ts";
import { goToIdle } from "./_view-model.type.ts";

export const viewState$ = new rx.BehaviorSubject<ViewModelState>(goToIdle())

export const selectedShapesIds$ = viewState$.pipe(
  rx.filter(state => isNotUndefined(state.selectedIds)),
  rx.map(state => state.selectedIds),
  rx.startWith(new Set<string>()),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const shapesToRecord$ = shapes$.pipe(
  rx.map((nodes) => Object.fromEntries(nodes.map((node) => ([node.id, node])))),
  rx.shareReplay({ refCount: true, bufferSize: 1 })
)

const cache = <Fn extends (...args: any[]) => any>(fn: Fn) => {
  const map = new Map<string, ReturnType<Fn>>()

  return (...args: Parameters<Fn>): ReturnType<Fn> => {
    const read = map.get(JSON.stringify(args))
    if (isNotUndefined(read)) return read

    const result = fn(...args)
    map.set(JSON.stringify(args), result)

    return result
  }
}

const CacheShapes = new Map<string, ShapeToView>()

const watchedShapeProps: (keyof ShapeToView)[] = ["x", "y", "width", "height"]

export const shapesToView$ = shapes$.pipe(
  rx.map((shapes) => shapes.map((shape) => {
    if (isUndefined(CacheShapes.get(shape.id))) CacheShapes.set(shape.id, addSketchPropertiesToShape(shape))
    const readFromCache = CacheShapes.get(shape.id)

    if (isEqual(pick(shape, watchedShapeProps), pick(readFromCache, watchedShapeProps))) {
      return readFromCache
    }

    const updatedShape = addSketchPropertiesToShape(shape)
    CacheShapes.set(shape.id, updatedShape)

    return updatedShape
  }) as ShapeToView[]),
  rx.shareReplay({ refCount: true, bufferSize: 1 })
)

function addSketchPropertiesToShape(shape: Shape) {
  return match(shape, {
    rectangle: (shape) => shape.sketch ? _u.merge(shape, generateRectangleSketchProps(shape)) : shape,
    circle: (shape) => shape.sketch ? _u.merge(shape, generateEllipseSketchProps(shape)) : shape,
    square: (square) => square,
    arrow: (arrow) => arrow,
  }) as ShapeToView
}

export const viewModel$ = rx.combineLatest([viewState$, shapesToView$]).pipe(
  rx.map(([state, nodes]) => match(state, {
    shapesDragging: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node) => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      })),
    }),

    idle: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node) => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      })),
    }),

    shapesResize: (state): ViewModel => ({
      actions: {},
      nodes: nodes.map((node) => ({
        ...node,
        isSelected: state.selectedIds.has(node.id),
      })),
    }),
  })),
  rx.shareReplay({ bufferSize: 1, refCount: true })
)

export const shapesToRender$ = viewModel$.pipe(rx.map(model => model.nodes))
