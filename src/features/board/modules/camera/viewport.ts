import { canvas, resize$ } from "@/shared/lib/initial-canvas"
import { getCanvasSizes } from "@/shared/lib/utils"
import type { Point, Sizes } from "@/shared/type/shared"
import { isEqual } from "lodash"
import type { KeyboardEvent } from "react"
import * as rx from "rxjs"
import { VELOCITY_SCALE, ZOOM, ZOOM_INTENSITY, ZOOM_MAX_SCALE, ZOOM_MIN_SCALE } from "./_const"
import { getWorldPoints, type Camera, type ZoomAction } from "./_domain"

export const gridTypeSubject$ = new rx.BehaviorSubject<"lines" | "dots">("lines")

export const keyboardDown$ = rx.fromEvent<KeyboardEvent>(window, "keydown")
export const keyboardUp$ = rx.fromEvent<KeyboardEvent>(window, "keyup")

export const spacePressed$ = rx.merge(
  keyboardDown$.pipe(rx.map(event => event.code === "Space")),
  keyboardUp$.pipe(rx.filter(event => event.code === "Space"), rx.map(() => false)),
).pipe(
  rx.startWith(false),
  rx.shareReplay({ refCount: true, bufferSize: 1 }),
  rx.distinctUntilChanged()
)

spacePressed$.subscribe()

type EnableInertiaOptionsStream = {
  velocityScale: number
  minVelocity: number
  friction: number
}

export class Viewport {
  public readonly zoomTrigger$ = new rx.Subject<ZoomAction>()
  public readonly cameraSubject$ = new rx.BehaviorSubject({
    scale: 1,
    x: 0,
    y: 0,
  })

  private readonly _pointerLeave$: rx.Observable<PointerEvent>
  private readonly _pointerDown$: rx.Observable<PointerEvent>
  private readonly _pointerMove$: rx.Observable<PointerEvent>
  private readonly _pointerUp$: rx.Observable<PointerEvent>
  private readonly _wheel$: rx.Observable<WheelEvent>

  private readonly _velocity: Point = {
    x: 0,
    y: 0,
  }

  private readonly _panOffset: Point = {
    x: 0,
    y: 0,
  }

  private readonly _lastPosition: Point = {
    x: 0,
    y: 0,
  }

  public canvasSizes$: rx.Observable<Sizes>

  public canvasSegment$: rx.Observable<{
    startWorld: Point
    endWorld: Point
  }>

  private _inertiaStream: rx.Subscription | null = null
  private _wheelStream: rx.Subscription | null = null
  private _panStream: rx.Subscription | null = null

  get camera$() {
    return this.cameraSubject$
  }

  constructor(canvas: HTMLCanvasElement) {
    this._pointerLeave$ = rx.fromEvent<PointerEvent>(canvas, "pointerleave")
    this._pointerDown$ = rx.fromEvent<PointerEvent>(canvas, "pointerdown")
    this._pointerMove$ = rx.fromEvent<PointerEvent>(canvas, "pointermove")
    this._pointerUp$ = rx.fromEvent<PointerEvent>(canvas, "pointerup")
    this._wheel$ = rx.fromEvent<WheelEvent>(canvas, "wheel", {
      passive: true
    })

    this.canvasSizes$ = resize$.pipe(
      rx.map(getCanvasSizes),
      rx.startWith(getCanvasSizes()),
      rx.tap((canvasSizes) => Object.assign(canvas, canvasSizes)),
    )

    this.canvasSegment$ = rx.combineLatest({
      sizes: this.canvasSizes$,
      camera: this.camera$,
    }).pipe(rx.map(({ camera, sizes }) => getWorldPoints(camera, sizes)))
  }

  public remove() {
    this._inertiaStream?.unsubscribe()
    this._wheelStream?.unsubscribe()
    this._panStream?.unsubscribe()
  }

  public pan() {
    this._panStream = this._pointerDown$.pipe(
      rx.switchMap((event) => rx.of(event).pipe(
        rx.withLatestFrom(spacePressed$),
        rx.filter(([event, spacePressed]) => this._canStartPan(event, spacePressed)),
        rx.map(() => event)
      )),

      rx.withLatestFrom(this.cameraSubject$),
      rx.tap(([startEvent, camera]) => {
        this._panOffset.x = startEvent.offsetX - camera.x
        this._panOffset.y = startEvent.offsetY - camera.y

        this._lastPosition.x = startEvent.offsetX
        this._lastPosition.y = startEvent.offsetY

        this._velocity.x = 0
        this._velocity.y = 0
      }),

      rx.tap(() => document.documentElement.style.cursor = "grabbing"),

      rx.switchMap((dragState) => this._pointerMove$.pipe(
        rx.map((moveEvent) => ({ moveEvent, dragState })),
        rx.takeUntil(rx.merge(this._pointerUp$, this._pointerLeave$)),
        rx.map(({ moveEvent, dragState: [_, camera] }) => {
          this._velocity.x = (moveEvent.offsetX - this._lastPosition.x) * (this._inertiaOptions.velocityScale ?? VELOCITY_SCALE)
          this._velocity.y = (moveEvent.offsetY - this._lastPosition.y) * (this._inertiaOptions.velocityScale ?? VELOCITY_SCALE)

          this._lastPosition.x = moveEvent.offsetX
          this._lastPosition.y = moveEvent.offsetY

          return {
            x: moveEvent.offsetX - this._panOffset.x,
            y: moveEvent.offsetY - this._panOffset.y,
            scale: camera.scale,
          }
        }),

        rx.finalize(() => document.documentElement.style.cursor = "default")
      ))
    ).subscribe(this.cameraSubject$)

    return this
  }

  public wheel() {
    const wheelCamera$ = this._wheel$.pipe(
      rx.withLatestFrom(this.camera$),
      rx.map(([event, camera]) => this._changeZoom(camera, event)),
      rx.shareReplay(1)
    )

    const animateZoom$ = this.zoomTrigger$.pipe(
      rx.withLatestFrom(this.camera$),
      rx.switchMap(([action, camera]) => rx.animationFrames().pipe(
        rx.scan((acc) => ({ zoomIn: this._zoomIn, zoomOut: this._zoomOut })[action](acc, 0.05), camera),
        rx.takeUntil(rx.timer(100))
      ))
    )

    this._wheelStream = rx.merge(wheelCamera$, animateZoom$).subscribe(this.cameraSubject$)

    return this
  }

  private _inertiaOptions!: EnableInertiaOptionsStream

  public inertia(options: EnableInertiaOptionsStream) {
    this._inertiaOptions = options

    this._inertiaStream = this._pointerUp$.pipe(
      rx.withLatestFrom(this.cameraSubject$),
      rx.switchMap(([_, camera]) => rx.animationFrames().pipe(
        rx.scan(this._getCameraWithAppliedInertia.bind(this), camera),
        rx.pairwise(),
        rx.takeWhile(([prev, current]) => {
          const hasVelocity = Math.hypot(this._velocity.x, this._velocity.y) > this._inertiaOptions.minVelocity
          const hasMovement = !isEqual(prev, current)

          return hasVelocity && hasMovement
        }),
        rx.map(([_, current]) => current)
      ))
    ).subscribe(this.cameraSubject$)

    return this
  }

  private _getCameraWithAppliedInertia(camera: Camera) {
    const cameraWithVelocity = {
      x: camera.x + this._velocity.x,
      y: camera.y + this._velocity.y,
      scale: camera.scale,
    }

    this._velocity.x *= this._inertiaOptions.friction
    this._velocity.y *= this._inertiaOptions.friction

    return cameraWithVelocity
  }

  private _canStartPan(event: PointerEvent, spacePressed: boolean) {
    return (event.button === 1 && event.ctrlKey === false) || (spacePressed && event.button === 0)
  }

  private _zoomIn(camera: Camera, intensity = ZOOM_INTENSITY) {
    if (camera.scale >= ZOOM_MAX_SCALE) return camera

    return {
      ...camera,
      scale: camera.scale * (1 + intensity)
    }
  }

  private _zoomOut(camera: Camera, intensity = ZOOM_INTENSITY) {
    if (camera.scale <= ZOOM_MIN_SCALE) return camera

    return {
      ...camera,
      scale: camera.scale * (1 - intensity)
    }
  }

  private _changeZoom(camera: Camera, event: WheelEvent) {
    const delta = event.deltaY > 0 ? -ZOOM.INTENSITY : ZOOM.INTENSITY
    const newScale = camera.scale * (1 + delta)

    if (newScale < ZOOM.MIN_SCALE || newScale > ZOOM.MAX_SCALE) return camera

    const mouseX = event.offsetX
    const mouseY = event.offsetY

    return {
      x: mouseX - (mouseX - camera.x) * (newScale / camera.scale),
      y: mouseY - (mouseY - camera.y) * (newScale / camera.scale),
      scale: newScale
    }
  }
}

export const viewport = new Viewport(canvas)

viewport
  .inertia({
    velocityScale: 1.0,
    minVelocity: 0.5,
    friction: 0.9,
  })
  .wheel()
  .pan()