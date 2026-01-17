import { addPoint, multiplePoint, pointToSizes, sizesToPoint } from "@/shared/lib/point";
import { _u, isNotUndefined } from "@/shared/lib/utils";
import type { Point } from "@/shared/type/shared";
import { bind } from "@react-rxjs/core";
import * as rx from "rxjs";
import { shapes$ } from "../model";
import { camera$ } from "../modules/camera/_stream";
import { viewState$ } from "./state";

export const [useResizedShapeSizeToView] = bind(viewState$.pipe(
  rx.filter((viewModelState) => viewModelState.type === "shapesResize"),
  rx.filter((viewModelState) => viewModelState.selectedIds.size <= 1),
  rx.switchMap((viewModelState) => shapes$.pipe(
    rx.map((shapes) => shapes.find(shape => viewModelState.selectedIds.has(shape.id))),
    rx.filter(shape => isNotUndefined(shape)),
    rx.withLatestFrom(camera$),
    rx.map(([shape, camera]) => {
      const computeRect = (position: Point) => _u.merge(
        pointToSizes(multiplePoint(position, camera.scale)),
        addPoint(multiplePoint(shape, camera.scale), camera)
      )

      return {
        original: computeRect(sizesToPoint(shape)),
        toView: computeRect(addPoint(sizesToPoint(shape), 14))
      }
    }),
    rx.takeUntil(viewState$.pipe(rx.filter(state => state.type !== "shapesResize"))),
    rx.endWith(null),
  ))
), null)