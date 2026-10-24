import {getPointFromEvent} from "../../shared/point";
import type {State} from "./state.interface";
import {Point} from "../../maths";
import type {SimObject} from "../SimObject";
import type {Container} from "../Container";
import {ContextModel} from "../SelectionManager";
import {inject} from "inversify";
import {ResizeTransformService} from "../models/_resize.model";
import {CameraModel} from "../models/_camera.model";

export class IdleState {
  public constructor(
    @inject(CameraModel) private readonly camera: CameraModel,
    @inject(ContextModel) private readonly selection: ContextModel,
    @inject(ResizeTransformService) private readonly resizer: ResizeTransformService,
  ) {}

  private handleSelect({ context, objects }: {
    objects: Array<SimObject>
    context: Container
  }): void {
    this.resizer.select(context, ...objects)
    // this.app.subscribeToResizeHandlers(this.resizer.group.handlers)
  }

  public resizeHandler: State["resizeHandler"] = {
    onPointerDown: (event) => {
      this.resizer.operation.startTransform(event)
      // this.app.goToResizeState()
    },

    onPointerUp: (event) => {
      event.stopPropagation()
    }
  }

  public node: State["node"] = {
    onPointerDown: (event) => {
      event.stopPropagation()
    },

    onPointerUp: (event) => {
      event.stopPropagation()
    },
    
    click: (event) => {
      this.selection.click({
        target: event.target,
        targetMode: event.evt.ctrlKey,
        multiselectMode: event.evt.shiftKey,
        onSelect: this.handleSelect.bind(this),
      })
    },

    dblclick: (event) => {
      this.selection.dblclick({
        target: event.target,
        targetMode: event.evt.ctrlKey,
        multiselectMode: event.evt.shiftKey,
        onSelect: this.handleSelect.bind(this),
      })
    }
  }

  public canvas: State["canvas"] = {
    onPointerDown: (event) => {
      this.camera.lastPosition = Point.fromData(getPointFromEvent(event.evt))
    },

    onPointerMove: (event) => {
      const dragDistance = 3

      if (this.camera.lastPosition) {
        const currentPointerPos = Point.fromData(getPointFromEvent(event.evt))
        const delta = currentPointerPos.sub(this.camera.lastPosition!)
        if (delta.length() >= dragDistance) {
          // this.app.goToDraggingState(currentPointerPos)
        }
      }
    },

    onPointerUp: (_event) => {
      this.camera.lastPosition = null
      this.selection.contextExit()
      this.resizer.destroy()

      this.selection.selected.clear()
    }
  }
}