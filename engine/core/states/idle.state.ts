import type {SelectableNode} from "../SelectionManager";
import {doubleClick} from "../../utils";
import {getPointFromEvent} from "../../shared/point";
import {App} from "../__noname";
import type {State} from "./state.interface";
import {Point} from "../../maths";

export class IdleState {
  public constructor(private app: App) {
  }

  public get selection() {
    return this.app.contextModel
  }

  public get resizer() {
    return this.app.resizeModel
  }

  private handleSelect({node, ctrl, shift}: {
    node: SelectableNode
    shift: boolean
    ctrl: boolean
  }): void {

    if (ctrl && shift) {
      this.resizer.selected.add(node)
      this.resizer.group.commonParent = this.selection.context!
      this.resizer.select(this.selection.context!, ...Array.from(this.resizer.selected))
      this.app.subscribeToResizeHandlers(this.resizer.group.handlers)
      return
    }

    if (ctrl) {
      this.resizer.selected.clear()
      this.resizer.selected.add(node)
      this.resizer.group.commonParent = this.selection.context!
      this.resizer.select(this.selection.context!, node)
      this.app.subscribeToResizeHandlers(this.resizer.group.handlers)
      return
    }

  }

  public resizeHandler: State["resizeHandler"] = {
    onPointerDown: (event) => {
      this.resizer.operation.startTransform(event)
      this.app.goToResizeState()
    },

    onPointerUp: (event) => {
      event.stopPropagation()
    }
  }

  public node: State["node"] = {
    onPointerDown: (event) => {
      event.stopPropagation()
    },
    onPointerUp: doubleClick({
      threshold: 450,
      click: (event) => {
        event.stopPropagation()
        this.selection.click(event.target, (node) => this.handleSelect({
          shift: event.evt.shiftKey,
          ctrl: event.evt.ctrlKey,
          node,
        }))
      },
      dblclick: (event) => {
        event.stopPropagation()
        this.selection.dblclick(event.target, (node) => this.handleSelect({
          shift: event.evt.shiftKey,
          ctrl: event.evt.ctrlKey,
          node,
        }))
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

    onPointerUp: (_event) => {
      this.app.cameraModel.lastPosition = null
      this.app.contextModel.contextExit()
      this.app.resizeModel.destroy()
    }
  }
}