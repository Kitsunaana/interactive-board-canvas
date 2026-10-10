import { getPointFromEvent } from "../../shared/point";
import { App } from "../__noname";
import type { State } from "./state.interface";

export class PanningState {
  public constructor(private app: App) {}

  node: State["node"] = {}

  canvas: State["canvas"] = {
    onPointerMove: (event) => {
      this.app.cameraModel.handleMove(getPointFromEvent(event.evt))
      this.app.layer._position = this.app.cameraModel.position.clone()
    },
    onPointerUp: (event) => {
      this.app.cameraModel.handleUp(getPointFromEvent(event.evt))
      this.app.goToIdleState()
    }
  }
}