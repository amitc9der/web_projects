//Display The Canvas's dimensions.
// /** @typedef {typeof Promise} PromiseConstructor */
/** 
 * @param { CanvasRenderingContext2D } ctx - context
 * @param { HTMLCanvasElement } canvas - context
*/
async function displayCanvasDimension(canvas, ctx){
	ctx.shadowOffsetX = 2;
	ctx.shadowOffsetY = 2;
	ctx.shadowBlur = 2;
	ctx.shadowColor = "rgb(0 0 0 /50%)";

	ctx.font = "20px Times New Roman";
	ctx.fillStyle = "Black";
	ctx.fillText(`Height: ${canvas.height}, Weight: ${canvas.width}`, 5,30);
}
//Display mouse position.
//Capture all keyboard input except keyboard reserved by browser and windows.
//Capture Mouse Input

/**
 * @param { HTMLCanvasElement } canvas - Canvas
 * @returns { void }
 */
//FIXME: once body's Size increase it does decreases
function canvas_render(canvas) {
  console.log("Rerendering canvas");

  /** @type {CanvasRenderingContext2D } */
  const ctx = canvas.getContext("2d");
  console.log(ctx);

  if (ctx) {
	displayCanvasDimension(canvas,ctx);
    ctx.fillStyle = "rgb(200 0 0)";
    ctx.fillRect(10, 10, 50, 50);

    ctx.fillStyle = "rgb(0 0 200 / 50%)";
    ctx.fillRect(30, 30, 50, 50);

  } else {
    console.log("Unable to get context");
  }
}

/**
 * @param { ResizeObserverEntry[] } entries - entries array
 * @returns { void }
 */
function body_mutation_callback(entries) {
  console.log(entries);
  const canvas = document.getElementsByTagName("canvas")[0];
  canvas.height = entries[0].contentRect.height;
  canvas.width = entries[0].contentRect.width;
  canvas_render(canvas);
}

function main() {
  console.log("JS linked");

  /**@type { HTMLBodyElement } */
  const body_el = document.getElementsByTagName("body")[0];
  body_el.style.margin = "none";

  /**@type { HTMLCanvasElement } */
  const canvas = document.createElement("canvas");
  body_el.appendChild(canvas);

  /** @type { ResizeObserver } */
  const body_resize_observer = new ResizeObserver(body_mutation_callback);
  body_resize_observer.observe(body_el);
}

document.body.onload = main;
