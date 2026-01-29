import type { Point, Rect, RectWithId } from "@/shared/type/shared"
import { SELECTION_BOUNDS_PADDING } from "../_const"

export type CalcShapeResizePatchParams = {
  shape: RectWithId
  cursor: Point
}

export type CalcShapeResizePatch = (params: CalcShapeResizePatchParams) => Partial<Rect>

export const calcShapeRightBoundResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const angle = shape.transform.rotate;

  // Центр фигуры
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;

  // Угол для вычислений
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Левая сторона фигуры (anchor point)
  const leftX = centerX - (shape.width / 2) * cos;
  const leftY = centerY - (shape.width / 2) * sin;

  // Скорректированный курсор с учетом SELECTION_BOUNDS_PADDING
  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING;
  const correctedCursorY = cursor.y;

  // Вектор от левой стороны к скорректированному курсору
  const toCursorX = correctedCursorX - leftX;
  const toCursorY = correctedCursorY - leftY;

  // Направление оси X фигуры (от левой к правой стороне)
  const axisX = { x: cos, y: sin };

  // Проецируем вектор toCursor на axisX
  const dot = toCursorX * axisX.x + toCursorY * axisX.y;
  const axisLength = Math.sqrt(axisX.x * axisX.x + axisX.y * axisX.y);
  const projection = dot / axisLength;

  // Новая ширина
  const nextWidth = projection;

  // Добавляем flip логику из оригинального кода
  if (nextWidth <= 0) {
    // Flip режим - теперь курсор находится левее левой границы
    const delta = leftX - correctedCursorX;
    const flipWidth = delta - SELECTION_BOUNDS_PADDING * 2;
    
    if (flipWidth <= 0) {
      // Нулевая ширина
      return {
        width: 0,
        x: shape.x,
        y: shape.y
      };
    }
    
    // В flip режиме старая левая граница становится правой границей
    // Новая левая точка находится на расстоянии flipWidth в противоположном направлении axisX
    const newLeftX = leftX - axisX.x * flipWidth;
    const newLeftY = leftY - axisX.y * flipWidth;
    
    // Новый центр будет посередине между новой левой и старой левой точкой
    const newCenterX = (newLeftX + leftX) / 2;
    const newCenterY = (newLeftY + leftY) / 2;
    
    // Переводим обратно в координаты левого верхнего угла
    const newX = newCenterX - (flipWidth / 2);
    const newY = newCenterY - (shape.height / 2);
    
    return {
      width: flipWidth,
      x: newX,
      y: newY
    };
  }

  // Обычный режим - курсор правее левой границы
  // Новый центр будет смещен по направлению axisX на (nextWidth / 2)
  const newCenterX = leftX + (nextWidth / 2) * axisX.x;
  const newCenterY = leftY + (nextWidth / 2) * axisX.y;

  // Переводим обратно в координаты левого верхнего угла
  const newX = newCenterX - (nextWidth / 2);
  const newY = newCenterY - (shape.height / 2);

  return {
    width: nextWidth,
    x: newX,
    y: newY
  };
};

export const calcShapeRightBoundResizePatchVV: CalcShapeResizePatch = ({ shape, cursor }) => {
  const angle = shape.transform.rotate;

  // Центр фигуры
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;

  // Угол для вычислений
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Левая сторона фигуры (anchor point)
  const leftX = centerX - (shape.width / 2) * cos;
  const leftY = centerY - (shape.width / 2) * sin;

  // Вектор от левой стороны к курсору
  const toCursorX = cursor.x - leftX;
  const toCursorY = cursor.y - leftY;

  // Направление оси X фигуры (от левой к правой стороне)
  const axisX = { x: cos, y: sin };

  // Проецируем вектор toCursor на axisX
  const dot = toCursorX * axisX.x + toCursorY * axisX.y;
  const axisLength = Math.sqrt(axisX.x * axisX.x + axisX.y * axisX.y);
  const projection = dot / axisLength;

  // Новая ширина
  const nextWidth = projection;

  // Добавляем flip логику из оригинального кода
  if (nextWidth <= 0) {
    // Flip режим - теперь курсор находится левее левой границы
    const flipWidth = -nextWidth; // Положительная ширина
    
    if (flipWidth <= 0) {
      // Нулевая ширина
      return {
        width: 0,
        x: shape.x,
        y: shape.y
      };
    }
    
    // В flip режиме старая левая граница становится правой границей
    // Нужно найти новую левую границу
    const newLeftX = leftX - axisX.x * flipWidth;
    const newLeftY = leftY - axisX.y * flipWidth;
    
    // Новый центр будет посередине между новой левой и старой левой
    const newCenterX = (newLeftX + leftX) / 2;
    const newCenterY = (newLeftY + leftY) / 2;
    
    // Переводим обратно в координаты левого верхнего угла
    const newX = newCenterX - (flipWidth / 2);
    const newY = newCenterY - (shape.height / 2);
    
    return {
      width: flipWidth,
      x: newX,
      y: newY
    };
  }

  // Обычный режим - курсор правее левой границы
  // Новый центр будет смещен по направлению axisX на (nextWidth / 2)
  const newCenterX = leftX + (nextWidth / 2) * axisX.x;
  const newCenterY = leftY + (nextWidth / 2) * axisX.y;

  // Переводим обратно в координаты левого верхнего угла
  const newX = newCenterX - (nextWidth / 2);
  const newY = newCenterY - (shape.height / 2);

  return {
    width: nextWidth,
    x: newX,
    y: newY
  };
};

export const calcShapeRightBoundResizePatchV: CalcShapeResizePatch = ({ shape, cursor }) => {
  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING

  const left = shape.x
  const right = left + shape.width

  const delta = cursorX - right
  const nextWidth = shape.width + delta

  if (nextWidth <= 0) {
    const delta = left - cursorX
    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2

    if (nextWidth <= 0) {
      return {
        width: 0,
        x: left
      }
    }

    return {
      width: nextWidth,
      x: shape.x - nextWidth
    }
  }

  return {
    width: nextWidth
  }
}

export const calcShapeLeftBoundResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING

  const left = shape.x
  const right = left + shape.width

  const delta = left - cursorX
  const nextWidth = shape.width + delta

  if (nextWidth <= 0) {
    const delta = cursorX - right
    const nextWidth = delta - SELECTION_BOUNDS_PADDING * 2

    if (nextWidth <= 0) {
      return {
        x: right,
        width: 0,
      }
    }

    return {
      x: right,
      width: nextWidth,
    }
  }

  return {
    width: nextWidth,
    x: shape.x - delta,
  }
}

export const calcShapeBottomBoundResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const cursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const top = shape.y
  const bottom = top + shape.height

  const delta = cursorY - bottom
  const nextHeight = shape.height + delta

  if (nextHeight <= 0) {
    const delta = top - cursorY
    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2
    const nextY = shape.y - delta + SELECTION_BOUNDS_PADDING * 2

    if (nextHeight <= 0) {
      return {
        y: top,
        height: 0,
      }
    }

    return {
      y: nextY,
      height: nextHeight,
    }
  }

  return {
    height: nextHeight,
  }
}

export const calcShapeTopBoundResizePatch: CalcShapeResizePatch = ({ shape, cursor }) => {
  const cursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const top = shape.y
  const bottom = top + shape.height

  const delta = top - cursorY
  const nextHeight = shape.height + delta

  if (nextHeight <= 0) {
    const delta = cursorY - bottom
    const nextHeight = delta - SELECTION_BOUNDS_PADDING * 2

    if (nextHeight <= 0) {
      return {
        y: bottom,
        height: 0,
      }
    }

    return {
      height: nextHeight,
      y: bottom
    }
  }

  return {
    height: nextHeight,
    y: shape.y - delta,
  }
}

export const Short = {
  bottom: calcShapeBottomBoundResizePatch,
  right: calcShapeRightBoundResizePatch,
  left: calcShapeLeftBoundResizePatch,
  top: calcShapeTopBoundResizePatch,
}