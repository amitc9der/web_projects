//Display The Canvas's dimensions.

// /** @typedef {typeof Promise} PromiseConstructor */
/**
 * @param { CanvasRenderingContext2D } _ctx - context
 * @param { HTMLCanvasElement } _canvas - context
 */
async function displayCanvasDimension(_canvas, _ctx) {
  _ctx.shadowOffsetX = 2;
  _ctx.shadowOffsetY = 2;
  _ctx.shadowBlur = 2;
  _ctx.shadowColor = "rgb(0 0 0 /50%)";

  _ctx.font = "20px Times New Roman";
  _ctx.fillStyle = "Black";
  _ctx.fillText(`Height: ${_canvas.height}, Weight: ${_canvas.width}`, 5, 30);
}

//Display Text
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

//Display mouse position.
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
  return DisplayText(text, x, y, ctx);
}

//Capture all keyboard input except keyboard reserved by browser and windows.
//Capture Mouse Input

/**
 * @returns { void }
 */
function canvas_render(timestamp = 0) {
  // Calculate time since last frame
  const elapsed = timestamp - lastFrameTime;

  // Only render if enough time has passed
  if (elapsed > frameInterval) {
    // Update the last frame time
    // Note: Using the time that we SHOULD have rendered, not the actual time
    // This helps prevent drift
    lastFrameTime = timestamp - (elapsed % frameInterval);

    switch (active_tab) {
      case 1:
        ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx && render_tab_1(ctx);
        break;
      case 2:
        ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
        gl && render_tab_2(gl);
        break;
      default:
        break;
    }
  }
  requestId = window.requestAnimationFrame(canvas_render);
}

function render_tab_1(_ctx) {
  console.log("Rendering 1");
  displayCanvasDimension(canvas, _ctx);
  DisplayCursorPosition(canvas, _ctx);
  _ctx.fillStyle = "rgb(200 0 0)";
  _ctx.fillRect(100, 100, 50, 50);
  _ctx.fillStyle = "rgb(0 0 200 / 50%)";
  _ctx.fillRect(130, 130, 50, 50);
}

/**
 *@param {WebGLRenderingContext} _gl
 */
function render_tab_2(_gl) {
  // Set clear color to black, fully opaque
  _gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  _gl.clear(gl.COLOR_BUFFER_BIT);
}

/**
 * @param { ResizeObserverEntry[] } entries - entries array
 * @returns { void }
 */
function body_mutation_callback(entries) {
  const canvas = document.getElementsByTagName("canvas")[0];
  canvas.height = window.innerHeight;
  canvas.width = entries[0].contentBoxSize[0].inlineSize;
}

function main() {
  console.log("JS linked");

  /**@type { HTMLBodyElement } */
  const body_el = document.getElementsByTagName("body")[0];
  body_el.style.margin = "0px";

  //Create Canvas Element
  canvas = document.createElement("canvas");
  body_el.appendChild(canvas);

  //Detect Resize & Resize Canvas
  function setupCanvas(){
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
  setupCanvas();

  //GetContext
  ctx = canvas.getContext("2d");
  requestId = window.requestAnimationFrame(canvas_render);

  //Added Event Listener
  window.addEventListener("keydown", (e) => {
    if (e.altKey) {
      if (caputre_keyboard) {
        e.preventDefault();
      }
      switch (e.code) {
        case "Digit1":
          {
            requestId && window.cancelAnimationFrame(requestId);
            const _canvas = document.createElement("canvas");
            canvas && canvas.replaceWith(_canvas);
            canvas = _canvas;
            ctx = canvas.getContext("2d");
            console.log(ctx);
            setupCanvas();
            active_tab = 1;
            requestId = window.requestAnimationFrame(canvas_render);
          }
          break;
        case "Digit2":
          {
            requestId && window.cancelAnimationFrame(requestId);
            const _canvas = document.createElement("canvas");
            canvas && canvas.replaceWith(_canvas);
            canvas = _canvas;
            gl = canvas.getContext("webgl");
            console.log(gl);
            setupCanvas();
            active_tab = 2;
            requestId = window.requestAnimationFrame(canvas_render);
          }
          break;
        default:
          break;
      }
    }
  });
}

var active_tab = 1;
var caputre_keyboard = 1;

/** @typedef {Object} CursorPosition
 * @property {number} x - The x coordinate of the cursor position
 * @property {number} y - The y coordinate of the cursor position
 */

/** @type{ CursorPosition } */
var cursor_position = {
  x: 0,
  y: 0,
};

// Set the desired FPS
const targetFPS = 30;
const frameInterval = 1000 / targetFPS; // milliseconds per frame

// Track the time of the last frame
let lastFrameTime = 0;
var requestId;

/** @type {HTMLCanvasElement | null} -- canvas*/
var canvas = null;

/** @type {CanvasRenderingContext2D | null} */
var ctx = null;

/** @type { WebGLRenderingContext | null} */
var gl = null;

document.body.onload = main;
