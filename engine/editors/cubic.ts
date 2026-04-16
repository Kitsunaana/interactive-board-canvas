import { Point, type PointData } from "../maths/Point"

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const context = canvas.getContext("2d") as CanvasRenderingContext2D

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const mouse = new Point(0, 0)

const distance = (a: PointData, b: PointData) => Math.hypot(a.x - b.x, a.y - b.y)

const getPoint = (event: PointerEvent) => {
  const rect = event.target instanceof HTMLElement
    ? event.target.getBoundingClientRect()
    : { left: 0, top: 0 }

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

export type CubicNodeData = PointData & {
  cpIn: PointData
  cpOut: PointData
}

export type CubicNodeHandleOut = {
  type: "handle"
  sub: "out"
  idx: number
}

export type CubicNodeHandleIn = {
  type: "handle"
  sub: "in"
  idx: number
}

export type CubicNodeAnchor = {
  type: "anchor"
  idx: number
}

export type CubicNodeHitCandidate =
  | CubicNodeHandleOut
  | CubicNodeHandleIn
  | CubicNodeAnchor

export type CubicDragStatePlace = {
  type: "place"
  idx: number
  sx: number
  sy: number
}

export type CubicDragStateHandler = CubicNodeHitCandidate & {
  startNode: CubicNodeData
  sx: number
  sy: number
}

export type CubicDragState = CubicDragStatePlace | CubicDragStateHandler

export class Cubic {
  public readonly mode = "cubic" as const
  public readonly nodes: Array<CubicNodeData> = []

  public hitRadius: number = 8
  public isDrawing: boolean = false
  public closed: boolean = false

  public dragState: CubicDragState | null = null

  public hitTest(point: PointData): CubicNodeHitCandidate | null {
    for (let index = 0; index < this.nodes.length; index++) {
      const node = this.nodes[index]

      if (distance(point, node.cpOut) <= this.hitRadius)
        return { type: 'handle', sub: 'out', idx: index }

      if (distance(point, node.cpIn) <= this.hitRadius)
        return { type: 'handle', sub: 'in', idx: index }

      if (distance(point, node) <= this.hitRadius)
        return { type: 'anchor', idx: index }
    }

    return null
  }

  public onMouseDown(event: PointerEvent): void {
    const point = getPoint(event)
    const hit = this.hitTest(point)

    if (hit) {
      const node = this.nodes[hit.idx]

      this.dragState = {
        sx: point.x,
        sy: point.y,
        idx: hit.idx,
        type: hit.type,
        sub: hit.type === "handle" ? hit.sub : null,
        startNode: {
          x: node.x,
          y: node.y,
          cpIn: {
            ...node.cpIn,
          },
          cpOut: {
            ...node.cpOut,
          }
        }
      } as CubicDragStateHandler

      return
    }

    if (this.isDrawing) {
      // Продолжаем путь
      this.nodes.push({
        ...point,
        cpIn: { ...point },
        cpOut: { ...point },
      })

      this.dragState = {
        type: "place",
        idx: this.nodes.length - 1,
        sx: point.x,
        sy: point.y,
      }
    } else {
      // Начинаем новый
      this.nodes.splice(0, this.nodes.length)

      this.nodes.push({
        ...point,
        cpIn: { ...point },
        cpOut: { ...point },
      })

      this.isDrawing = true
      this.closed = false
    }
  }

  public onMouseMove(event: PointerEvent): void {
    if (this.dragState === null) {
      // canvas.style.cursor = this.hitTest(mouse)
      // ? "grab"
      // : (this.isDrawing ? "crosshair" : "default")

      return
    }

    const dx = mouse.x - this.dragState.sx
    const dy = mouse.y - this.dragState.sy
    const node = this.nodes[this.dragState.idx]

    switch (this.dragState.type) {
      case "place": {
        node.cpOut.x = node.x + dx
        node.cpOut.y = node.y + dy

        node.cpIn.x = node.x - dx
        node.cpIn.y = node.y - dy
        return
      }
      case "handle": {
        if (this.dragState.sub === "out") {
          node.cpOut.x = mouse.x
          node.cpOut.y = mouse.y

          node.cpIn.x = 2 * node.x - node.cpOut.x
          node.cpIn.y = 2 * node.y - node.cpOut.y
          return
        }

        if (this.dragState.sub === "in") {
          node.cpIn.x = mouse.x
          node.cpIn.y = mouse.y

          node.cpOut.x = 2 * node.x - node.cpIn.x
          node.cpOut.y = 2 * node.y - node.cpIn.y
          return
        }

      }
      case "anchor": {
        node.x = this.dragState.startNode.x + dx
        node.y = this.dragState.startNode.y + dy

        node.cpIn.x = this.dragState.startNode.cpIn.x + dx
        node.cpIn.y = this.dragState.startNode.cpIn.y + dy

        node.cpOut.x = this.dragState.startNode.cpOut.x + dx
        node.cpOut.y = this.dragState.startNode.cpOut.y + dy

        return
      }
    }
  }

  public onMouseUp(event: PointerEvent): void {
    const drag = this.dragState

    if (drag) {
      const node = this.nodes[drag.idx]

      if (drag.type === "place") {
        if (Math.hypot(mouse.x - drag.sx, mouse.y - drag.sy) < 3) {
          node.cpIn.x = node.cpOut.x = node.x
          node.cpIn.y = node.cpOut.y = node.y
        }
      }

      this.dragState = null
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      this.isDrawing = false
      this.dragState = null
    }
  }

  public onDblclick(event: MouseEvent) {
    if (this.isDrawing && this.nodes.length >= 2) {
      this.closed = true
      this.isDrawing = false
    }
  }

  public render(context: CanvasRenderingContext2D): void {
    if (this.nodes.length === 0) return

    this._drawBezierCurve(context)

    if (this._shouldDrawPreviewCurve()) this._drawPreviewCurve(context)
    else if (this._shouldDrawInteractiveCurve()) this._drawInteractiveCurveWhileDragging(context)

    this._drawControlGuides(context)
  }

  private _shouldDrawPreviewCurve(): boolean {
    return this.isDrawing && !this.closed && !this.dragState
  }

  private _shouldDrawInteractiveCurve(): boolean {
    return (
      !!this.dragState &&
      this.dragState.type === "place" &&
      this.dragState.idx > 0
    )
  }

  private _applyActiveStrokeStyle(context: CanvasRenderingContext2D) {
    context.strokeStyle = "#a6e3a1"
    context.lineWidth = 3
  }

  private _drawPreviewCurve(context: CanvasRenderingContext2D) {
    const previewPoints = [...this.nodes, { ...mouse }]

    const prev = this.nodes[this.nodes.length - 1]
    const current = previewPoints[previewPoints.length - 1]

    context.beginPath()
    context.moveTo(prev.x, prev.y)

    context.bezierCurveTo(
      prev.cpOut.x,
      prev.cpOut.y,
      current.x,
      current.y,
      current.x,
      current.y,
    )

    this._applyActiveStrokeStyle(context)
    context.stroke()
  }

  private _drawInteractiveCurveWhileDragging(context: CanvasRenderingContext2D): void {
    const prev = this.nodes[this.dragState!.idx - 1]
    const current = this.nodes[this.dragState!.idx]

    context.beginPath()
    context.moveTo(prev.x, prev.y)

    context.bezierCurveTo(
      prev.cpOut.x,
      prev.cpOut.y,
      current.cpIn.x,
      current.cpIn.y,
      current.x,
      current.y,
    )

    this._applyActiveStrokeStyle(context)
    context.stroke()
  }

  private _drawControlGuides(context: CanvasRenderingContext2D): void {
    context.setLineDash([3, 3])
    context.strokeStyle = "#4a4a5e"
    context.lineWidth = 1.2

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i]

      context.beginPath()
      context.moveTo(node.x, node.y)
      context.lineTo(node.cpIn.x, node.cpIn.y)
      context.stroke()

      context.beginPath()
      context.moveTo(node.x, node.y)
      context.lineTo(node.cpOut.x, node.cpOut.y)
      context.stroke()
    }

    context.setLineDash([])

    const drag = this.dragState

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i]
      const isDrag = drag && drag.idx === i
      const color = isDrag ? "#f38ba8" : "a6e3a1"

      drawDot(context, node, color, isDrag ? 7 : 5)

      const isOut = drag && drag.type === "handle" && drag.idx === i && drag.sub === "out"
      const isIn = drag && drag.type === "handle" && drag.idx === i && drag.sub === "in"

      drawDot(context, node.cpOut, isOut ? "#fab387" : "#f9e2af", isOut ? 5 : 4)
      drawDot(context, node.cpIn, isIn ? "#fab387" : "#f9e2af", isIn ? 5 : 4)
    }
  }

  private _drawBezierCurve(context: CanvasRenderingContext2D) {
    const nodes = this.nodes

    context.beginPath()
    context.moveTo(nodes[0].x, nodes[0].y)

    for (let i = 1; i < nodes.length; i++) {
      context.bezierCurveTo(
        nodes[i - 1].cpOut.x,
        nodes[i - 1].cpOut.y,
        nodes[i].cpIn.x,
        nodes[i].cpIn.y,
        nodes[i].x,
        nodes[i].y,
      )
    }

    if (this.closed && nodes.length > 2) {
      const last = nodes[nodes.length - 1]
      const first = nodes[0]

      context.bezierCurveTo(
        last.cpOut.x,
        last.cpOut.y,
        first.cpIn.x,
        first.cpIn.y,
        first.x,
        first.y,
      )
    }

    context.strokeStyle = "#89b4fa"
    context.lineWidth = 2.5
    context.lineJoin = "round"
    context.lineCap = "round"
    context.stroke()

    if (this.closed) {
      context.fillStyle = "rgba(137,180,250,0.06)"
      context.fill()
    }
  }
}

const cubic = new Cubic()

function drawDot(context: CanvasRenderingContext2D, point: PointData, color: string, radius: number) {
  context.beginPath()
  context.arc(point.x, point.y, radius, 0, Math.PI * 2)
  context.fillStyle = color
  context.fill()
  context.strokeStyle = "#101018"
  context.lineWidth = 2
  context.stroke()
}

const render = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)

  cubic.render(context)

  requestAnimationFrame(render)
}

render()

window.addEventListener("dblclick", (event) => {
  cubic.onDblclick(event)
})

window.addEventListener("keydown", (event) => {
  cubic.onKeyDown(event)
})

window.addEventListener("pointerdown", (event) => {
  mouse.copyFrom(getPoint(event))
  cubic.onMouseDown(event)
})

window.addEventListener("pointermove", (event) => {
  mouse.copyFrom(getPoint(event))
  cubic.onMouseMove(event)
})

window.addEventListener("pointerup", (event) => {
  cubic.onMouseUp(event)
})