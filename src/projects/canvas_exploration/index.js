// Set the desired FPS
/**
 * @typedef {Object} CursorPosition
 * @property {number} x - The x coordinate of the cursor position
 * @property {number} y - The y coordinate of the cursor position
 */

/**
 * @typedef { Object } DisplayTextType
 * @property { string } txt
 * @property { number } x
 * @property { number } y
 * @property { CanvasRenderingContext2D } ctx
 * @property { string } font
 * @property { number } shadowOffsetX - shadowOffsetX
 * @property { number } shadowOffsetY - showdowOffsetY
*/
/** @type{ CursorPosition } */
var cursor_position = {
  x: 0,
  y: 0,
};

let lastFrameTime = 0;
const targetFPS = 30;
const frameInterval = 1000 / targetFPS; // milliseconds per frame

// Wait for DOM to be fully loaded
window.addEventListener("DOMContentLoaded", () => {
  const main = document.body; // or document.querySelector("main") if you use a <main> tag

  main.innerHTML = "";

  // Create Canvas Element
  let canvas = document.createElement("canvas");
  main.appendChild(canvas);

  // Get Context
  let ctx = canvas.getContext("2d");

  // Initial render setup
  let requestId = window.requestAnimationFrame((timestamp) => {
    console.log("Starting");
    canvas_render(canvas, ctx, requestId, timestamp);
  });

  // Cancel and recreate canvas for setup
  requestId && window.cancelAnimationFrame(requestId);
  const _canvas = document.createElement("canvas");
  canvas && canvas.replaceWith(_canvas);
  canvas = _canvas;
  ctx = canvas.getContext("2d");

  // Setup
  setupCanvas(canvas);

  // Start render loop again
  requestId = window.requestAnimationFrame((timestamp) => {
    canvas_render(canvas, ctx, requestId, timestamp);
  });
});

//Detect Resize & Resize Canvas
function setupCanvas(canvas) {
  /** @type { ResizeObserver } */
  const body_resize_observer = new ResizeObserver(body_mutation_callback);
  body_resize_observer.observe(document.documentElement);

  canvas.addEventListener("mousemove", (event) => {
    cursor_position = {
      x: event.clientX,
      y: event.clientY,
    };
  });
}

// /* @typedef {typeof Promise} PromiseConstructor */
/**
 * @param { CanvasRenderingContext2D } _ctx - context
 * @param { HTMLCanvasElement } _canvas - context
 */
function displayCanvasDimension(_canvas, _ctx) {
  _ctx.shadowOffsetX = 2;
  _ctx.shadowOffsetY = 2;
  _ctx.shadowBlur = 2;
  _ctx.shadowColor = "rgb(0 0 0 /50%)";

  _ctx.font = "20px Times New Roman";
  _ctx.fillStyle = "Black";
  _ctx.fillText(`Height: ${_canvas.height}, Weight: ${_canvas.width}`, 5, 30);
}

/**
 *@param { HTMLCanvasElement } _canvas  - Canvas
 * @param { CanvasRenderingContext2D } _ctx - context
 *
 * @returns { DisplayTextType }
 */
function DisplayCursorPosition(_canvas, _ctx) {
  const x = 10;
  const y = 70;
  const text = `Mouse is at X: ${cursor_position.x}, Y: ${cursor_position.y}`;
  return DisplayText(text, x, y, _ctx);
}

function render_tab_1(canvas, _ctx) {
  displayCanvasDimension(canvas, _ctx);
  DisplayCursorPosition(canvas, _ctx);
  _ctx.fillStyle = "rgb(200 0 0)";
  _ctx.fillRect(100, 100, 50, 50);
  _ctx.fillStyle = "rgb(0 0 200 / 50%)";
  _ctx.fillRect(130, 130, 50, 50);
}

/**
 * Renders content onto the provided canvas context at a controlled frame rate.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to render onto.
 * @param {CanvasRenderingContext2D} ctx - The rendering context of the canvas.
 * @param {number} requestId - The current animation frame request ID.
 * @param {number} [timestamp=0] - The current timestamp from requestAnimationFrame, defaults to 0.
 * @returns {void}
 */
function canvas_render(canvas, ctx, requestId, timestamp = 0) {
  // Calculate time since last frame
  const elapsed = timestamp - lastFrameTime;

  // Only render if enough time has passed
  if (elapsed > frameInterval) {
    // Update the last frame time
    // Note: Using the time that we SHOULD have rendered, not the actual time
    // This helps prevent drift
    lastFrameTime = timestamp - (elapsed % frameInterval);

    ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);

    //check hash route path
    ctx && render_tab_1(canvas, ctx);
  }
  requestId = window.requestAnimationFrame((timestamp) => {
    canvas_render(canvas, ctx, requestId, timestamp);
  });
}

//Display Text
/**
 * @param { string } txt - text to display
 * @param { number } x - x corrdination
 * @param { number } y - y  corrdination
 * @param { CanvasRenderingContext2D } _ctx - canvas context
 * @param { string } font - font for text
 * @param { string } fillStyle - font for text
 * @param { number } shadowOffsetX - shadowOffsetX
 * @param { number } shadowOffsetY - shadowOffsetY
 * @returns { DisplayTextType }
 */
function DisplayText(
  txt,
  x,
  y,
  _ctx,
  font = "20px Times New Roman",
  fillStyle = "Black",
  shadowOffsetX = 0,
  shadowOffsetY = 0
) {
  let _shadowOffsetX = shadowOffsetX ? shadowOffsetX : 0;
  let _shadowOffsetY = shadowOffsetY ? shadowOffsetY : 0;

  _ctx.shadowOffsetX = _shadowOffsetX;
  _ctx.shadowOffsetY = _shadowOffsetY;
  _ctx.fillStyle = fillStyle;
  _ctx.font = font;
  _ctx.fillText(txt, x, y);
  const displayText = {
    txt: txt,
    ctx: _ctx,
    x: x,
    y: y,
    shadowOffsetX: _shadowOffsetX,
    shadowOffsetY: _shadowOffsetY,
    font: font,
  };

  return displayText;
}

/**
 * @param { ResizeObserverEntry[] } entries - entries array
 * @returns { void }
 */
export function body_mutation_callback(entries) {
  let canvas = document.getElementsByTagName("canvas")[0];
  if (canvas) {
    canvas.height = window.innerHeight;
    canvas.width = entries[0].contentBoxSize[0].inlineSize;
  }
}