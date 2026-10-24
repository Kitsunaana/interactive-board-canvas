import {Layer} from "./Layer";
import {ContextModel} from "./SelectionManager";
import {Shape} from "./Shape";
import {type PointData} from "../maths";
import type {EventObject} from "../behaviors/EventBehavior";
import {CameraModel} from "./models/_camera.model";
import {PanningState} from "./states/panning.state";
import {IdleState} from "./states/idle.state";
import type {State} from "./states/state.interface";
import {ResizeState} from "./states/resize.state";
import {ResizeTransformService} from "./models/_resize.model";
import {Container} from "inversify";
import {Stage} from "./Stage";
import {Background} from "../world/BG";
import {circleShape_1, group5, group6, polygonShape_1, polygonShape_2, polygonShape_3} from "../test_shapes";

export class App {
  public resizeModel: ResizeTransformService
  public contextModel: ContextModel
  public cameraModel: CameraModel

  public activeState: State

  public states = {
    dragging: new PanningState(this),
    resize: new ResizeState(this),
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

  public constructor() {
    const stage = new Stage({
      height: window.innerHeight,
      width: window.innerWidth,
      draggable: false,
    });

    const container = new Container()
    
    container.bind(Background).toSelf().inSingletonScope()
    container.bind(ContextModel).toSelf().inSingletonScope()
    container.bind(CameraModel).toSelf().inSingletonScope()
    container.bind(ResizeTransformService).toSelf().inSingletonScope()
    container.bind(IdleState).toSelf().inSingletonScope()
    
    const layer = container.get(Background)
    this.layer = layer
    stage.appendChild(layer)

    group5.appendChild(polygonShape_1, polygonShape_2)
    group6.appendChild(group5, polygonShape_3)
    layer.appendChild(group6, circleShape_1)
    group6.rotate(0.2)

    
    this.resizeModel = container.get(ResizeTransformService)
    this.contextModel = container.get(ContextModel)
    this.cameraModel = container.get(CameraModel)

    this.states.idle = container.get(IdleState)
    
    this.activeState = this.states.idle
    
    const update = () => {
      this.cameraModel.update()
      layer._position = this.cameraModel.position.clone()

      // console.log(this.cameraModel.position.array())

      requestAnimationFrame(update)
    }

    update()


    layer.on("pointerdown", (event: EventObject<PointerEvent>) => this.activeState.canvas?.onPointerDown?.(event))
    layer.on("pointermove", (event: EventObject<PointerEvent>) => this.activeState.canvas?.onPointerMove?.(event))
    layer.on("pointerup", (event: EventObject<PointerEvent>) => this.activeState.canvas?.onPointerUp?.(event))

    layer.getShapes().forEach((child) => {
      child.on("pointerdown", (event: EventObject<PointerEvent, Shape>) => this.activeState.node?.onPointerDown?.(event))
      child.on("pointermove", (event: EventObject<PointerEvent, Shape>) => this.activeState.node?.onPointerMove?.(event))
      child.on("pointerup", (event: EventObject<PointerEvent, Shape>) => this.activeState.node?.onPointerUp?.(event))

      child.on("dblclick", (event: EventObject<PointerEvent, Shape>) => this.activeState.node?.dblclick?.(event))
      child.on("click", (event: EventObject<PointerEvent, Shape>) => this.activeState.node?.click?.(event))
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


