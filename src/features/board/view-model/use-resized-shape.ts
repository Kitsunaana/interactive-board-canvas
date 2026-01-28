import { isNotUndefined } from "@/shared/lib/utils";
import { bind } from "@react-rxjs/core";
import * as rx from "rxjs";
import { shapes$ } from "../model/shapes";
import { camera$ } from "../modules/camera/_stream";
import { viewState$ } from "./state";

export const [useResizedShapeSizeToView] = bind(viewState$.pipe(
  rx.filter((viewState) => viewState.type === "shapesResize"),
  rx.filter((viewState) => viewState.selectedIds.size <= 1),
  rx.switchMap((viewState) => shapes$.pipe(
    rx.map((shapes) => shapes.find(shape => viewState.selectedIds.has(shape.id))),
    rx.filter(shape => isNotUndefined(shape)),
    rx.withLatestFrom(camera$),
    rx.map(([_shape, _camera]) => {
      // const computeRect = (position: Point) => _u.merge(
      //   pointToSizes(multiplePoint(position, camera.scale)),
      //   addPoint(multiplePoint(getBoundingBox(shape), camera.scale), camera)
      // )

      // return {
      //   original: computeRect(sizesToPoint(getBoundingBox(shape))),
      //   toView: computeRect(addPoint(sizesToPoint(getBoundingBox(shape)), 14))
      // }

      return {
        original: { x: 0, y: 0, width: 0, height: 0 },
        toView: { x: 0, y: 0, width: 0, height: 0 }
      }
    }),
    rx.takeUntil(viewState$.pipe(rx.filter(state => state.type !== "shapesResize"))),
    rx.endWith(null),
  ))
), null)