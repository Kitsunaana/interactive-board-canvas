import type {App} from "../__noname";
import type {State} from "./state.interface";

export class ResizeState {
  public constructor(private readonly app: App) {
  }

  public node: State["node"] = {}
  
  public get resizer() {
    return this.app.resizeModel
  }

  public canvas: State["canvas"] = {
    onPointerMove: (event) => {
      this.resizer.operation.processTransform(event)
      this.resizer.group.updateHandlersPosition()
    },

    onPointerUp: (event) => {
      this.resizer.operation.finishTransform(event)
      this.app.goToIdleState()
    },
  }
  
  public resizeHandler: State["resizeHandler"] = {
    onPointerUp: (event) => {
      event.stopPropagation()
      
      this.resizer.operation.finishTransform(event)
      this.app.goToIdleState()
    }
  }
}