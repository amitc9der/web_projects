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

//Display Text
/** 
 * @param { string } txt - context 
 * @param { number } x - context 
 * @param { number } y - context 
 * @param { CanvasRenderingContext2D } ctx - context 
 * @param { font } txt - context 
 * @param { number } shadowOffsetX - context 
 * @param { number } shadowOffsetY - context 
 * @returns {function(ctx): void}
*/
//FIXME: Clear The Preivous Text;
function DisplayText(txt,x,y,ctx,font = "20px Times New Roman", shadowOffsetX = 0,shadowOffsetY = 0){
  let _shadowOffsetX = shadowOffsetX ? shadowOffsetX : 0;
  let _shadowOffsetY =  shadowOffsetY ? shadowOffsetY : 0;
  let textMetrics = ctx.measureText(txt);
  const boxStartX = x - textMetrics.actualBoundingBoxLeft;
  const boxStartY = y - textMetrics.actualBoundingBoxAscent; 

  /** @type { function(ctx): void} */
  let clearCallback;

  /** @type { function(ctx): void} */
  clearCallback = (c)=>{
    const textHeight = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent + _shadowOffsetY;
    const textWidth = textMetrics.actualBoundingBoxLeft + textMetrics.actualBoundingBoxRight + _shadowOffsetX;
    // c.clearRect(x-textMetrics.actualBoundingBoxLeft ,y-textMetrics.fontBoundingBoxAscent +_shadowOffsetY,x+textWidth,textHeight);
    c.clearRect(boxStartX  - _shadowOffsetX, boxStartY - _shadowOffsetY, textWidth,textHeight);
    // c.fillStyle = "rgb(200 0 0)";
    // c.strokeRect(x-textMetrics.actualBoundingBoxLeft,y-textMetrics.fontBoundingBoxAscent,textWidth,textHeight);
  }
  clearCallback(ctx);

  ctx.shadowOffsetX = _shadowOffsetX;
  ctx.shadowOffsetY = _shadowOffsetY;
  ctx.fillStyle = "Black";
  ctx.font = "20px Times New Roman";
  ctx.fillText(txt,x,y);

  return clearCallback;

}

//Display mouse position.
/**
 *@param { HTMLCanvasElement } canvas  - Canvas
 * @param { CanvasRenderingContext2D } ctx - context
*/
//FIXME: //Need to fix the drawring over probelm. 
async function DisplayCursorPosition(canvas,ctx){
  const x = 10;
  const y = 70;
  /** @type { function(ctx): void} */
  let clearCallback;

  canvas.addEventListener("mousemove",(event)=>{
    const text = `Mouse is at X: ${event.clientX}, Y: ${event.clientY}`;
    clearCallback = DisplayText(text,x,y,ctx);
  })
  canvas.addEventListener("mouseover",(event)=>{
    // console.log("Mouse Over",event);
  })
  canvas.addEventListener("mouseleave",(event)=>{
    clearCallback(ctx);
  })
}
//Capture all keyboard input except keyboard reserved by browser and windows.
//Capture Mouse Input

/**
 * @param { HTMLCanvasElement } canvas - Canvas
 * @returns { void }
*/
function canvas_render(canvas) {
  // console.log("Rerendering canvas");

  /** @type {CanvasRenderingContext2D } */
  const ctx = canvas.getContext("2d");
  // console.log(ctx);

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    displayCanvasDimension(canvas,ctx);
    DisplayCursorPosition(canvas,ctx);
    // ctx.fillStyle = "rgb(200 0 0)";
    // ctx.fillRect(100, 100, 50, 50);

    // ctx.fillStyle = "rgb(0 0 200 / 50%)";
    // ctx.fillRect(130, 130, 50, 50);

  } else {
    console.log("Unable to get context");
  }
}

/**
 * @param { ResizeObserverEntry[] } entries - entries array
 * @returns { void }
*/
function body_mutation_callback(entries) {
  // console.log(entries);
  const canvas = document.getElementsByTagName("canvas")[0];
  canvas.height = window.innerHeight;
  canvas.width = entries[0].contentBoxSize[0].inlineSize;
  console.log(canvas.height,canvas.width);
  canvas_render(canvas);
}

function main() {
  // console.log("JS linked");

  /**@type { HTMLBodyElement } */
  const body_el = document.getElementsByTagName("body")[0];
  body_el.style.margin = "0px";

  /**@type { HTMLCanvasElement } */
  const canvas = document.createElement("canvas");
  body_el.appendChild(canvas);

  /** @type { ResizeObserver } */
  const body_resize_observer = new ResizeObserver(body_mutation_callback);
  body_resize_observer.observe(document.documentElement);
}

document.body.onload = main;
