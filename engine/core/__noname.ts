import {Layer} from "./Layer";
import {ContextModel} from "./SelectionManager";
import {Shape} from "./Shape";
import {Matrix3x3, type PointData} from "../maths";
import type {EventObject} from "../behaviors/EventBehavior_v2";
import {CameraModel} from "./models/_camera.model";
import {PanningState} from "./states/panning.state";
import {IdleState} from "./states/idle.state";
import type {State} from "./states/state.interface";
import {ResizeState} from "./states/resize.state";
import {ResizeTransformModel} from "./models/_resize.model";

export class App {
  public resizeModel: ResizeTransformModel
  public contextModel: ContextModel
  public cameraModel: CameraModel
  
  public activeState: State

  public states = {
    dragging: new PanningState(this),
    resize: new ResizeState(this),
    idle: new IdleState(this),
  }

  public goToDraggingState(startPosition: PointData) {
    this.cameraModel.handleStart(startPosition)
    this.activeState = this.states.dragging
  }

  public goToIdleState() {
    this.activeState = this.states.idle
  }
  
  public goToResizeState() {
    this.activeState = this.states.resize
  }
  
  public constructor(public readonly layer: Layer) {
    this.resizeModel = new ResizeTransformModel(layer)
    this.contextModel = new ContextModel(layer)
    this.cameraModel = new CameraModel()

    this.activeState = this.states.idle

    const update = () => {
      this.cameraModel.update()
      this.layer._position = this.cameraModel.position.clone()

      requestAnimationFrame(update)
    }

    update()


    this.layer.on("pointerdown", (event: EventObject<PointerEvent>) => this.activeState.canvas?.onPointerDown?.(event))
    this.layer.on("pointermove", (event: EventObject<PointerEvent>) => this.activeState.canvas?.onPointerMove?.(event))
    this.layer.on("pointerup", (event: EventObject<PointerEvent>) => this.activeState.canvas?.onPointerUp?.(event))

    this.layer.getShapes().forEach((child) => {
      child.on("pointerdown", (event: EventObject<PointerEvent, Shape>) => this.activeState.node?.onPointerDown?.(event))
      child.on("pointermove", (event: EventObject<PointerEvent, Shape>) => this.activeState.node?.onPointerMove?.(event))
      child.on("pointerup", (event: EventObject<PointerEvent, Shape>) => this.activeState.node?.onPointerUp?.(event))
    })
  }
  
  public subscribeToResizeHandlers(handlers: Array<Shape>) {
    handlers.forEach((handler) => {
      handler.on("pointerdown", (event: EventObject<PointerEvent>) => this.activeState.resizeHandler?.onPointerDown?.(event))
      handler.on("pointermove", (event: EventObject<PointerEvent>) => this.activeState.resizeHandler?.onPointerMove?.(event))
      handler.on("pointerup", (event: EventObject<PointerEvent>) => this.activeState.resizeHandler?.onPointerUp?.(event))
    })
  }
}