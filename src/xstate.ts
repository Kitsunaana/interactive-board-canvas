import { assign, createActor, setup } from "xstate"

type GridType = "lines" | "dots" | "none"

type Context = {
  gridType: GridType
}

type Events = { type: "update", gridType: GridType }

const gridMachine = setup({
  types: {
    context: {} as Context,
    events: {} as Events,
  }
})
  .createMachine({
    id: "gridRenderer",
    initial: "Active",
    context: {
      gridType: "lines",
    },
    states: {
      Active: {
        on: {
          update: {
            target: "Active",
            actions: assign({
              gridType: (({ event }) => event.gridType)
            })
          }
        }
      }
    },
  })

export const gridActor = createActor(gridMachine).start()

// export const changeGridType$ = new Subject<{ gridType: GridType }>()

// changeGridType$.subscribe((event) => {
//   gridActor.send({
//     gridType: event.gridType,
//     type: "update",
//   })
// })

// gridActor.send({ type: "update", gridType: "dots" })

// export const state$ = fromEventPattern(
//   (handler) => gridActor.subscribe(handler),
//   (subscribe) => (subscribe as unknown as Subscription).unsubscribe()
// )
//   .pipe(map((state) => state.context))
