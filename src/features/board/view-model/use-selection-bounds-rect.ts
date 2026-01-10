import { addPoint, multiplePoint, pointToSizes, sizesToPoint } from "@/shared/lib/point";
import { _u, isNotUndefined } from "@/shared/lib/utils";
import { bind } from "@react-rxjs/core";
import * as rx from "rxjs"
import { shapes$ } from "../model";
import { camera$ } from "../modules/_camera/_stream";
import { viewModelState$ } from "./state/_view-model";

export const [useSelectionBoundsRect] = bind(viewModelState$.pipe(
  rx.filter((viewModelState) => viewModelState.type === "shapesResize"),
  rx.switchMap((viewModelState) => shapes$.pipe(
    rx.map((shapes) => shapes.find(shape => viewModelState.selectedIds.has(shape.id))),
    rx.filter(shape => isNotUndefined(shape)),
    rx.withLatestFrom(camera$),
    rx.map(([shape, camera]) => _u.merge(
      pointToSizes(multiplePoint(sizesToPoint(shape), camera.scale)),
      addPoint(multiplePoint(shape, camera.scale), camera)
    )),
    rx.takeUntil(viewModelState$.pipe(rx.filter(state => state.type !== "shapesResize"))),
    rx.endWith(null),
  ))
), null)