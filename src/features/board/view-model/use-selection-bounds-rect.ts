import { addPoint, multiplePoint, pointToSizes, sizesToPoint } from "@/shared/lib/point";
import { _u, isNotUndefined } from "@/shared/lib/utils";
import { bind } from "@react-rxjs/core";
import { endWith, filter, map, switchMap, takeUntil, withLatestFrom } from "rxjs";
import { shapes$ } from "../model";
import { camera$ } from "../modules/_camera/_stream";
import { viewModelState$ } from "./state/_view-model";

export const [useSelectionBoundsRect] = bind(viewModelState$.pipe(
  filter((viewModelState) => viewModelState.type === "shapesResize"),
  switchMap((viewModelState) => shapes$.pipe(
    map((shapes) => shapes.find(shape => viewModelState.selectedIds.has(shape.id))),
    filter(shape => isNotUndefined(shape)),
    withLatestFrom(camera$),
    map(([shape, camera]) => _u.merge(
      pointToSizes(multiplePoint(addPoint(sizesToPoint(shape), 0), camera.scale)),
      addPoint(multiplePoint(shape, camera.scale), camera)
    )),
    takeUntil(viewModelState$.pipe(filter(state => state.type !== "shapesResize"))),
    endWith(null),
  ))
), null)