import { match } from "@/shared/lib/match"
import * as rx from "rxjs"
import { selectItems } from "../domain/selection"
import { spacePressed$ } from "../modules/camera"
import { mouseUp$ } from "../modules/pick-node"
import type { HitTarget } from "../modules/pick-node/_core"
import { goToIdle, viewState$, type IdleViewState } from "../view-model/state"

const shapeSelect = ({ event, shapeId, idleState }: {
  idleState: IdleViewState
  event: PointerEvent
  shapeId: string
}): IdleViewState => {
  if (idleState.selectedIds.has(shapeId) && !event.ctrlKey) return idleState

  return {
    ...idleState,
    selectedIds: selectItems({
      modif: event.ctrlKey ? "toggle" : "replace",
      initialSelected: idleState.selectedIds,
      ids: [shapeId],
    })
  }
}

const isValidSelectionMouseUp = (node: HitTarget, event: PointerEvent) => {
  return (
    (!event.shiftKey && event.button === 0) &&
    (node.type === "shape" || node.type === "canvas")
  )
}

export const resolveShapeSelectionFlow$ = mouseUp$.pipe(
  rx.filter(({ event, node }) => isValidSelectionMouseUp(node, event)),

  rx.switchMap((downEvent) => {
    return rx.of(downEvent).pipe(
      rx.withLatestFrom(spacePressed$),
      rx.filter(([_, spacePressed]) => spacePressed === false),
      rx.map(() => downEvent)
    )
  }),

  rx.withLatestFrom(viewState$),

  rx.map(([upEvent, state]) => ({ ...upEvent, state })),
  rx.switchMap(({ node, event, state }) => match(state, {
    selectionWindow: (state) => rx.of(goToIdle({ selectedIds: state.selectedIds })),

    shapesResize: (state) => rx.of(state),

    shapesRotate: (state) => rx.of(goToIdle({ selectedIds: state.selectedIds })),

    shapesDragging: (state) => rx.of(state.needToDeselect
      ? goToIdle()
      : goToIdle({ selectedIds: state.selectedIds })
    ),

    idle: (idleState) => {
      if (node.type === "shape") return rx.of(shapeSelect({ shapeId: node.shapeId, idleState, event }))
      if (node.type === "canvas") return rx.of(goToIdle())

      return rx.EMPTY
    },
  })),
)