import { shapesDraggingFlow$ } from "../../model/dragging.flow"
import { shapesResizeFlowViaBound$ } from "../../model/resize"
import { resolveShapeSelectionFlow$ } from "../../model/resolve-selection.flow"
import { shapesRotateFlow$ } from "../../model/rotate/rotate.flow"
import { shapes$ } from "../../model/shapes"
import { viewState$ } from "../state"

// shapesResizeViaCorner$.subscribe(shapes$)
shapesResizeFlowViaBound$.subscribe(shapes$)
shapesDraggingFlow$.subscribe(shapes$)
shapesRotateFlow$.subscribe(shapes$)

resolveShapeSelectionFlow$.subscribe(viewState$)