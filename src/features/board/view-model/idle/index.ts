import { shapesDraggingFlow$ } from "../../model/dragging.flow"
import { shapesResizeFlowViaBound$, shapesResizeViaCorner$ } from "../../model/resize"
import { shapesRotateFlow$ } from "../../model/rotate.flow"
import { resolveShapeSelectionFlow$ } from "../../model/resolve-selection.flow"
import { shapes$ } from "../../model/shapes"
import { viewState$ } from "../state"

shapesResizeViaCorner$.subscribe(shapes$)
shapesResizeFlowViaBound$.subscribe(shapes$)
shapesDraggingFlow$.subscribe(shapes$)
shapesRotateFlow$.subscribe(shapes$)

resolveShapeSelectionFlow$.subscribe(viewState$)