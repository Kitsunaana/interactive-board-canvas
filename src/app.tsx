import { useEffect, useRef, useState } from "react";
import "./index.css"

export function App() {
  return (
    <WebGLPickerCanvas width={window.innerWidth} height={window.innerHeight} />
  )
}

type TriangleFigure = {
  pickColor: [number, number, number],
  type: 'triangle'
  name: string,
  id: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
}

type CircleFigure = {
  pickColor: [number, number, number],
  radius: number,
  type: 'circle'
  name: string,
  id: number,
  x: number,
  y: number,
}

type RectangleFigure = {
  pickColor: [number, number, number],
  height: number,
  width: number,
  name: string,
  type: 'rect'
  id: number,
  x: number,
  y: number,
}

type ObjectsFigure =
  | RectangleFigure
  | TriangleFigure
  | CircleFigure

const createRandomRectangles = (count: number): RectangleFigure[] => {
  return Array.from({ length: count }, () => ({
    type: "rect",
    id: Math.random(),
    name: "Прямоугольник",
    pickColor: [255, 0, 0],
    x: Math.random() * 10000,
    y: Math.random() * 10000,
    width: 200,
    height: 120,
  }))
}

function WebGLPickerCanvas({ width, height }) {
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [objects, setObjects] = useState<ObjectsFigure[]>([
    {
      id: 1,
      name: "Прямоугольник",
      pickColor: [255, 0, 0],
      x: 100,
      y: 100,
      width: 200,
      height: 120,
      type: 'rect'
    },
    {
      id: 2,
      name: "Треугольник",
      pickColor: [0, 255, 0],
      x1: 400,
      y1: 150,
      x2: 500,
      y2: 350,
      x3: 300,
      y3: 390,
      type: 'triangle'
    },
    {
      id: 3,
      name: "Круг",
      pickColor: [0, 0, 255],
      x: 600,
      y: 300,
      radius: 70,
      type: 'circle'
    },
  ]);

  const cameraRef = useRef({
    x: 0,
    y: 0,
    scale: 1
  });

  const panStateRef = useRef({
    isPanning: false,
    offsetX: 0,
    offsetY: 0
  });

  const dragStateRef = useRef<{
    isDragging: boolean;
    selectedObject: any;
    offsetX: number;
    offsetY: number;
  }>({
    isDragging: false,
    selectedObject: null,
    offsetX: 0,
    offsetY: 0
  });

  // ---------- Шейдеры ----------
  const vertexShaderSrc = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    uniform vec3 u_camera;

    void main() {
      vec2 worldPos = (a_position - u_camera.xy) * u_camera.z;
      vec2 zeroToOne = worldPos / u_resolution;
      vec2 clip = zeroToOne * 2.0 - 1.0;
      gl_Position = vec4(clip * vec2(1, -1), 0, 1);
    }
  `;

  const fragmentShaderSrc = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
  `;

  // ---------- Вспомогательные ----------
  function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader error:", gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) {
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program error:", gl.getProgramInfoLog(program));
    }
    return program;
  }

  // ---------- Основной рендер ----------
  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    const webglCanvas = webglCanvasRef.current;
    if (!gridCanvas || !webglCanvas) return;

    const ctx = gridCanvas.getContext("2d");
    if (!ctx) return;

    const gl = webglCanvas.getContext("webgl", { antialias: false, alpha: true });
    if (!gl) {
      console.error("WebGL не поддерживается в этом браузере.");
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;

    const posLoc = gl.getAttribLocation(program, "a_position");
    const colorLoc = gl.getUniformLocation(program, "u_color");
    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const cameraLoc = gl.getUniformLocation(program, "u_camera");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // ---------- Утилиты камеры ----------
    function screenToWorld(screenX: number, screenY: number) {
      const camera = cameraRef.current;
      return {
        x: (screenX / camera.scale) + camera.x,
        y: (screenY / camera.scale) + camera.y
      };
    }

    // ---------- Функции сетки ----------
    const baseGridSize = 8;
    const gridLevels = [
      { size: baseGridSize, minScale: 2.0 },
      { size: baseGridSize * 2, minScale: 1.0 },
      { size: baseGridSize * 4, minScale: 0.5 },
      { size: baseGridSize * 8, minScale: 0.25 },
      { size: baseGridSize * 16, minScale: 0.125 },
      { size: baseGridSize * 32, minScale: 0.0625 },
      { size: baseGridSize * 64, minScale: 0.03125 },
      { size: baseGridSize * 128, minScale: 0.015625 },
      { size: baseGridSize * 256, minScale: 0.0078125 },
      { size: baseGridSize * 512, minScale: 0.00390625 },
      { size: baseGridSize * 1024, minScale: 0.001953125 },
      { size: baseGridSize * 2048, minScale: 0 },
    ];

    function getNextLevelMinScale(level: any) {
      const index = gridLevels.indexOf(level);
      return gridLevels[index - 1]?.minScale || level.minScale * 2;
    }

    function getFadeProgress(level: any) {
      const nextLevelMinScale = getNextLevelMinScale(level);
      const fadeRange = nextLevelMinScale - level.minScale;
      return Math.min(1, Math.max(0, (cameraRef.current.scale - level.minScale) / fadeRange));
    }

    // ---------- Функции фигур ----------
    function rect(x: number, y: number, w: number, h: number) {
      return new Float32Array([
        x, y,
        x + w, y,
        x, y + h,
        x, y + h,
        x + w, y,
        x + w, y + h,
      ]);
    }

    function triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
      return new Float32Array([x1, y1, x2, y2, x3, y3]);
    }

    function circle(cx: number, cy: number, r: number, segments = 40) {
      const pts = [];
      for (let i = 0; i < segments; i++) {
        const a1 = (i / segments) * Math.PI * 2;
        const a2 = ((i + 1) / segments) * Math.PI * 2;
        pts.push(cx, cy);
        pts.push(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
        pts.push(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
      }
      return new Float32Array(pts);
    }

    // ---------- Рендер сетки на 2D canvas ----------
    function drawGrid() {
      ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

      // Background: rgb(242, 242, 242)
      ctx.fillStyle = 'rgb(242, 242, 242)';
      ctx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);

      ctx.save();

      const startWorld = screenToWorld(0, 0);
      const endWorld = screenToWorld(gridCanvas.width, gridCanvas.height);

      // Применяем трансформацию камеры
      ctx.translate(-cameraRef.current.x * cameraRef.current.scale, -cameraRef.current.y * cameraRef.current.scale);
      ctx.scale(cameraRef.current.scale, cameraRef.current.scale);

      for (const level of gridLevels) {
        if (cameraRef.current.scale < level.minScale) continue;

        const fadeProgress = getFadeProgress(level);
        if (fadeProgress <= 0 || fadeProgress < 0.2) continue;

        const startX = Math.floor(startWorld.x / level.size) * level.size;
        const startY = Math.floor(startWorld.y / level.size) * level.size;
        const endX = Math.ceil(endWorld.x / level.size) * level.size;
        const endY = Math.ceil(endWorld.y / level.size) * level.size;

        // Grid lines: rgb(200, 200, 200)
        ctx.strokeStyle = `rgba(200, 200, 200, ${fadeProgress})`;
        ctx.lineWidth = 1 / cameraRef.current.scale;

        ctx.beginPath();
        // Вертикальные линии
        for (let x = startX; x <= endX; x += level.size) {
          ctx.moveTo(x, startY);
          ctx.lineTo(x, endY);
        }
        // Горизонтальные линии
        for (let y = startY; y <= endY; y += level.size) {
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
        }
        ctx.stroke();
      }

      ctx.restore();
    }

    // ---------- Рендер фигур на WebGL canvas ----------
    function drawScene(isPicking = false) {
      gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);

      // Прозрачный фон для WebGL canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniform2f(resLoc, webglCanvas.width, webglCanvas.height);
      gl.uniform3f(cameraLoc, cameraRef.current.x, cameraRef.current.y, cameraRef.current.scale);

      // Рисуем объекты
      for (const obj of objects) {
        // Рисуем тень только для прямоугольников и не в режиме picking
        if (!isPicking && obj.type === 'rect' && obj.x !== undefined && obj.y !== undefined) {
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

          // Параметры тени
          const shadowOffsetX = 5;  // смещение тени по X
          const shadowOffsetY = 5;  // смещение тени по Y
          const shadowColor = [0, 0, 0, 0.3];  // черная с прозрачностью 30%

          // Рисуем тень (смещенный прямоугольник)
          gl.uniform4fv(colorLoc, shadowColor);
          const shadowVerts = rect(obj.x + shadowOffsetX, obj.y + shadowOffsetY, obj.width, obj.height);
          gl.bufferData(gl.ARRAY_BUFFER, shadowVerts, gl.STATIC_DRAW);
          gl.drawArrays(gl.TRIANGLES, 0, shadowVerts.length / 2);

          gl.disable(gl.BLEND);
        }

        // Рисуем сам объект
        const color = isPicking
          ? [...obj.pickColor.map((v) => v / 255), 1]
          : [
            obj.pickColor[0] / 255,
            obj.pickColor[1] / 255,
            obj.pickColor[2] / 255,
            1,
          ];

        gl.uniform4fv(colorLoc, color);

        let verts: Float32Array | undefined;
        if (obj.type === 'rect' && obj.x !== undefined && obj.y !== undefined) {
          verts = rect(obj.x, obj.y, obj.width!, obj.height!);
        } else if (obj.type === 'triangle') {
          verts = triangle(obj.x1!, obj.y1!, obj.x2!, obj.y2!, obj.x3!, obj.y3!);
        } else if (obj.type === 'circle' && obj.x !== undefined && obj.y !== undefined) {
          verts = circle(obj.x, obj.y, obj.radius!, 40);
        }

        if (verts) {
          gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
          gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
        }
      }
    }

    // ---------- Цикл анимации ----------
    let animationId: number;
    function animate() {
      drawGrid();        // Рисуем сетку на 2D canvas
      drawScene(false);  // Рисуем фигуры на WebGL canvas
      animationId = requestAnimationFrame(animate);
    }
    animate();

    // ---------- Функция определения объекта под курсором ----------
    function getObjectAtPosition(clientX: number, clientY: number) {
      const rect = webglCanvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = rect.height - (clientY - rect.top);

      drawScene(true);

      const pixel = new Uint8Array(4);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

      const [r, g, b] = pixel;

      const hit = objects.find(
        (o) =>
          o.pickColor[0] === r &&
          o.pickColor[1] === g &&
          o.pickColor[2] === b
      );

      drawScene(false);
      drawGrid();
      return hit;
    }

    // ---------- Обработка перетаскивания ----------
    const handleMouseDown = (e: MouseEvent) => {
      // Средняя кнопка мыши или Shift + левая кнопка для перемещения камеры
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        const rect = webglCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        panStateRef.current.isPanning = true;
        panStateRef.current.offsetX = mouseX + cameraRef.current.x * cameraRef.current.scale;
        panStateRef.current.offsetY = mouseY + cameraRef.current.y * cameraRef.current.scale;
        webglCanvas.style.cursor = "grabbing";
        return;
      }

      const hit = getObjectAtPosition(e.clientX, e.clientY);

      if (hit) {
        console.log(`🎯 Выбран объект: ${hit.name} (id=${hit.id})`);
        dragStateRef.current.isDragging = true;
        dragStateRef.current.selectedObject = hit;

        const rect = webglCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Конвертируем screen координаты в world координаты
        const worldPos = screenToWorld(mouseX, mouseY);

        if (hit.type === 'rect' && hit.x !== undefined && hit.y !== undefined) {
          dragStateRef.current.offsetX = worldPos.x - hit.x;
          dragStateRef.current.offsetY = worldPos.y - hit.y;
        } else if (hit.type === 'circle' && hit.x !== undefined && hit.y !== undefined) {
          dragStateRef.current.offsetX = worldPos.x - hit.x;
          dragStateRef.current.offsetY = worldPos.y - hit.y;
        } else if (hit.type === 'triangle' && hit.x1 !== undefined && hit.y1 !== undefined) {
          // Для треугольника используем центроид
          const centerX = (hit.x1 + hit.x2! + hit.x3!) / 3;
          const centerY = (hit.y1 + hit.y2! + hit.y3!) / 3;
          dragStateRef.current.offsetX = worldPos.x - centerX;
          dragStateRef.current.offsetY = worldPos.y - centerY;
        }

        webglCanvas.style.cursor = "grabbing";
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = webglCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Перемещение камеры
      if (panStateRef.current.isPanning) {
        cameraRef.current.x = (panStateRef.current.offsetX - mouseX) / cameraRef.current.scale;
        cameraRef.current.y = (panStateRef.current.offsetY - mouseY) / cameraRef.current.scale;
        return;
      }

      // Перемещение объекта
      if (!dragStateRef.current.isDragging) return;

      const obj = dragStateRef.current.selectedObject;

      // Конвертируем screen координаты в world координаты
      const worldPos = screenToWorld(mouseX, mouseY);

      setObjects(prevObjects =>
        prevObjects.map(o => {
          if (o.id !== obj.id) return o;

          if (o.type === 'rect') {
            return {
              ...o,
              x: worldPos.x - dragStateRef.current.offsetX,
              y: worldPos.y - dragStateRef.current.offsetY
            };
          } else if (o.type === 'circle') {
            return {
              ...o,
              x: worldPos.x - dragStateRef.current.offsetX,
              y: worldPos.y - dragStateRef.current.offsetY
            };
          } else if (o.type === 'triangle' && o.x1 !== undefined && o.y1 !== undefined) {
            const oldCenterX = (o.x1 + o.x2! + o.x3!) / 3;
            const oldCenterY = (o.y1 + o.y2! + o.y3!) / 3;
            const newCenterX = worldPos.x - dragStateRef.current.offsetX;
            const newCenterY = worldPos.y - dragStateRef.current.offsetY;
            const dx = newCenterX - oldCenterX;
            const dy = newCenterY - oldCenterY;

            return {
              ...o,
              x1: o.x1 + dx,
              y1: o.y1 + dy,
              x2: o.x2! + dx,
              y2: o.y2! + dy,
              x3: o.x3! + dx,
              y3: o.y3! + dy
            };
          }
          return o;
        })
      );
    };

    const handleMouseUp = (_e: MouseEvent) => {
      if (panStateRef.current.isPanning) {
        panStateRef.current.isPanning = false;
        webglCanvas.style.cursor = "default";
      }

      if (dragStateRef.current.isDragging) {
        dragStateRef.current.isDragging = false;
        dragStateRef.current.selectedObject = null;
        webglCanvas.style.cursor = "default";
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const zoomIntensity = 0.1;
      const zoomMinScale = 0.01;
      const zoomMaxScale = 10;

      const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
      const newScale = cameraRef.current.scale * (1 + delta);

      if (newScale < zoomMinScale || newScale > zoomMaxScale) return;

      const rect = webglCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Зум к точке курсора
      const worldBeforeX = (mouseX / cameraRef.current.scale) + cameraRef.current.x;
      const worldBeforeY = (mouseY / cameraRef.current.scale) + cameraRef.current.y;

      cameraRef.current.scale = newScale;

      cameraRef.current.x = worldBeforeX - (mouseX / newScale);
      cameraRef.current.y = worldBeforeY - (mouseY / newScale);
    };

    webglCanvas.addEventListener("mousedown", handleMouseDown);
    webglCanvas.addEventListener("mousemove", handleMouseMove);
    webglCanvas.addEventListener("mouseup", handleMouseUp);
    webglCanvas.addEventListener("mouseleave", handleMouseUp);
    webglCanvas.addEventListener("wheel", handleWheel);

    // ---------- Очистка ----------
    return () => {
      cancelAnimationFrame(animationId);
      webglCanvas.removeEventListener("mousedown", handleMouseDown);
      webglCanvas.removeEventListener("mousemove", handleMouseMove);
      webglCanvas.removeEventListener("mouseup", handleMouseUp);
      webglCanvas.removeEventListener("mouseleave", handleMouseUp);
      webglCanvas.removeEventListener("wheel", handleWheel);
    };
  }, [objects]);

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Canvas для сетки (2D) */}
      <canvas
        ref={gridCanvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
        }}
      />
      {/* Canvas для фигур (WebGL) */}
      <canvas
        ref={webglCanvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
        }}
      />
    </div>
  );
}