import type {SelectableNode} from "../SelectionManager";
import {doubleClick} from "../../utils";
import {getPointFromEvent} from "../../shared/point";
import {App} from "../__noname";
import type {State} from "./state.interface";
import {Point} from "../../maths";

export class IdleState {

  public constructor(private app: App) {
  }

  public get context() {
    return this.app.contextModel
  }

  public get resizer() {
    return this.app.resizeModel
  }

  private handleSelect(node: SelectableNode): void {
    this.resizer.selected.clear()
    this.resizer.selected.add(node)

    this.resizer.create(node)
    this.app.subscribeToResizeHandlers(this.resizer.state.group.handlers)
  }

  public resizeHandler: State["resizeHandler"] = {
    onPointerDown: (event) => {
      this.resizer.state.operation.startTransform(event)
      this.app.goToResizeState()
    }
  }

  public node: State["node"] = {
    onPointerDown: doubleClick({
      threshold: 450,
      click: (event) => {
        event.stopPropagation()
        this.context.click(event.target, this.handleSelect.bind(this))
      },
      dblclick: (event) => {
        event.stopPropagation()
        this.context.dblclick(event.target, this.handleSelect.bind(this))
      }
    }),
  }

  public canvas: State["canvas"] = {
    onPointerDown: (event) => {
      this.app.cameraModel.lastPosition = Point.fromData(getPointFromEvent(event.evt))
    },

    onPointerMove: (event) => {
      const dragDistance = 3
      
      if (this.app.cameraModel.lastPosition) {
        const currentPointerPos = Point.fromData(getPointFromEvent(event.evt))
        const delta = currentPointerPos.sub(this.app.cameraModel.lastPosition!)
        if (delta.length() >= dragDistance) {
          this.app.goToDraggingState(currentPointerPos)
        }
      }
    },

    onPointerUp: (event) => {
      this.app.cameraModel.lastPosition = null

      this.app.resizeModel.destroy()
    }
  }
}