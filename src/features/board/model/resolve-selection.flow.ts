import { match } from "@/shared/lib/match"
import * as rx from "rxjs"
import { isCanvas, isShape } from "../domain/is"
import { selectItems } from "../domain/selection"
import { mouseUp$ } from "../modules/pick-node"
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

export const resolveShapeSelectionFlow$ = mouseUp$.pipe(
  rx.filter(({ event }) => !event.shiftKey && event.button === 0),
  rx.filter(({ node }) => isShape(node) || isCanvas(node)),
  rx.withLatestFrom(viewState$),
  rx.map(([upEvent, state]) => ({ ...upEvent, state })),
  rx.switchMap(({ node, event, state }) => match(state, {
    shapesResize: (state) => rx.of(state),

    shapesDragging: (state) => rx.of(state.needToDeselect
      ? goToIdle()
      : goToIdle({ selectedIds: state.selectedIds })
    ),

    idle: (idleState) => {
      if (isShape(node)) return rx.of(shapeSelect({ shapeId: node.id, idleState, event }))
      if (isCanvas(node)) return rx.of(goToIdle())

      return rx.EMPTY
    },
  })),
)