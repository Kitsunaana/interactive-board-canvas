import { match } from "@/shared/lib/match"
import * as rx from "rxjs"
import { isCanvas, isShape } from "../domain/is"
import { selectItems } from "../domain/selection"
import { mouseUp$ } from "../modules/pick-node"
import { goToIdle, viewState$, type IdleViewState } from "../view-model/state"
import { spacePressed$ } from "../modules/camera"

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

const isValidSelectionMouseUp = (node: any, event: PointerEvent) => {
  return (
    (!event.shiftKey && event.button === 0) &&
    (isShape(node) || isCanvas(node))
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