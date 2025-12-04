import { Signal, signal, useComputed, useSignal } from "@preact/signals-react";
import type { Camera, Point, Rect } from "../../type";

type ViewModelParams = {
  state: Signal<ViewModelState>
  camera: Camera
}

type IdleViewState = {
  type: "idle",
  selectedIds: Set<string>
  mouseDown?:
  | (Point & {
    type: "overlay"
    isRightClick: boolean
  })
  | (Point & {
    type: "node"
    nodeId: string
    isDragging: boolean
  })
}

const goToIdle = ({ selectedIds, mouseDown }: {
  mouseDown?: IdleViewState["mouseDown"]
  selectedIds?: Set<string>
}) => ({
  selectedIds: selectedIds ?? new Set<string>(),
  type: "idle" as const,
  mouseDown,
})

type ViewModelState = IdleViewState

export const viewModelState = signal<ViewModelState>(goToIdle({}))

type Sticker = {
  type: "sticker"
  id: string

  isSelected: boolean
  height: number
  width: number
  text: string
  x: number
  y: number
}

const stickers = signal<Sticker[]>([
  {
    type: "sticker",
    id: "sticker-1",
    height: 100,
    width: 200,
    isSelected: false,
    text: "Hello, World!",
    x: 100,
    y: 100,
  },
  {
    type: "sticker",
    id: "sticker-2",
    height: 100,
    width: 200,
    isSelected: false,
    text: "Hello, World!",
    x: 200,
    y: 300,
  }
])

type ActiveBoxDot = {
  radius: number
  x: number
  y: number
}

export type ViewModelStickerNode = {
  type: "sticker"
  id: string

  activeBoxDots?: ActiveBoxDot[]
  isSelected: boolean
  height: number
  width: number
  text: string
  x: number
  y: number

  onClick?: (event: PointerEvent) => void
  onMouseUp?: (event: MouseEvent) => void
  onMouseDown?: (event: MouseEvent) => void
}

export interface ViewModelV2 {
  nodes: ViewModelStickerNode[]
  canvas?: {
    onMouseMove?: (event: PointerEvent) => void
    onMouseUp?: (event: PointerEvent) => void
  }
}

export type SelectionModifier = "replace" | "add" | "toggle"
export type Selection = Set<string>

export function selectItems({ ids, modif, initialSelected }: {
  initialSelected: Selection
  modif: SelectionModifier
  ids: string[]
}) {
  if (modif === "replace") {
    return new Set(ids);
  }

  if (modif === "add") {
    return new Set([...initialSelected, ...ids]);
  }

  if (modif === "toggle") {
    const newIds = new Set(ids);

    const base = Array.from(initialSelected).filter((id) => !newIds.has(id));
    const added = ids.filter((id) => !initialSelected.has(id));

    return new Set(base.concat(added));
  }

  return initialSelected;
}

const useSelection = (viewModelState: Signal<ViewModelState>) => {
  const isSelected = (idleState: IdleViewState, nodeId: string) => {
    return idleState.selectedIds.has(nodeId);
  }

  const select = ({ state, modif, ids }: {
    state: Signal<IdleViewState>
    modif: SelectionModifier
    ids: string[]
  }) => {
    viewModelState.value = {
      ...state.value,
      selectedIds: selectItems({
        initialSelected: state.value.selectedIds,
        modif,
        ids,
      })
    }
  };

  const handleNodeClick = ({ event, idleState, nodeId }: {
    idleState: Signal<IdleViewState>;
    event: MouseEvent;
    nodeId: string;
  }) => {
    const modif: SelectionModifier = event.ctrlKey || event.shiftKey ? "toggle" : "replace";

    select({
      state: idleState,
      ids: [nodeId],
      modif
    });
  };

  const handleOverlayMouseUp = (idleState: IdleViewState) => {
    if (idleState.mouseDown) {
      viewModelState.value = {
        ...idleState,
        selectedIds: selectItems({
          initialSelected: idleState.selectedIds,
          modif: "replace",
          ids: [],
        })
      }
    }
  }

  return {
    handleOverlayMouseUp,
    handleNodeClick,
    isSelected,
    select,
  };
}

const PADDING = 7

const getActiveBoxDots = ({ rect, camera }: {
  camera: Camera
  rect: Rect
}) => {
    const baseRadius = 5
    const scalePower = 0.75

    return [
      {
        x: rect.x - PADDING,
        y: rect.y - PADDING,
        radius: baseRadius / Math.pow(camera.scale, scalePower)
      },
      {
        x: rect.x + rect.width + PADDING,
        y: rect.y - PADDING,
        radius: baseRadius / Math.pow(camera.scale, scalePower)
      },
      {
        x: rect.x + rect.width + PADDING,
        y: rect.y + rect.height + PADDING,
        radius: baseRadius / Math.pow(camera.scale, scalePower)
      },
      {
        x: rect.x - PADDING,
        y: rect.y + rect.height + PADDING,
        radius: baseRadius / Math.pow(camera.scale, scalePower)
      },
    ]
  }

const useIdleViewModel = ({ state, camera }: ViewModelParams) => {
  const selection = useSelection(state)

  return (idleState: Signal<IdleViewState>): ViewModelV2 => {
    return {
      nodes: stickers.value.map((sticker) => ({
        ...sticker,
        isSelected: selection.isSelected(idleState.value, sticker.id),
        activeBoxDots: getActiveBoxDots({ camera, rect: sticker }),
        onMouseDown: (event) => {
          // console.log("Mouse down on sticker", sticker.id, event)
        },
        onMouseUp: (event) => {
          // console.log("Mouse up on sticker", sticker.id, event)
          console.log({ nodeId: sticker.id })

          selection.handleNodeClick({
            nodeId: sticker.id,
            idleState,
            event,
          })
        },
      })),
      canvas: {}
    }
  }
}

export const useViewModel = ({ camera }: { camera: Camera }) => {
  const state = useSignal<ViewModelState>(goToIdle({}))

  const newParams: ViewModelParams = {
    camera,
    state,
  }

  const getIdleViewModel = useIdleViewModel(newParams)

  const viewModelV3 = useComputed(() => ({
    idle: () => getIdleViewModel(state as Signal<IdleViewState>),
  })[state.value.type]?.())

  if (viewModelV3 === undefined) {
    throw new Error("View model is undefined")
  }

  return viewModelV3
}