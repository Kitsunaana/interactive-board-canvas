import type {App} from "../__noname";
import type {State} from "./state.interface";

export class ResizeState {
  public constructor(private readonly app: App) {
  }

  public node: State["node"] = {}

  public canvas: State["canvas"] = {
    onPointerMove: (event) => {
      this.app.resizeModel.state.operation.processTransform(event)
      this.app.resizeModel.state.group.updateHandlersPosition()
    },

    onPointerUp: (event) => {
      this.app.resizeModel.state.operation.finishTransform(event)
      this.app.goToIdleState()
    },
  }
  
  public resizeHandler: State["resizeHandler"] = {
    onPointerUp: (event) => {
      this.app.resizeModel.state.operation.finishTransform(event)
      this.app.goToIdleState()
    }
  }
}