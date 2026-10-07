import {getPointFromEvent} from "../../shared/point";
import {Matrix3x3} from "../../maths";
import {App} from "../__noname";
import type {State} from "./state.interface";

export class DraggingState {
  public constructor(private app: App) {}

  node: State["node"] = {}

  canvas: State["canvas"] = {
    onPointerMove: (event) => {
      this.app.cameraModel.handleMove(getPointFromEvent(event.evt))
      this.app.layer.localMatrix = Matrix3x3.translate(
        ...this.app.cameraModel.position.array()
      )
    },
    onPointerUp: (event) => {
      this.app.cameraModel.handleUp(getPointFromEvent(event.evt))
      this.app.goToIdleState()
    }
  }
}