
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
 * @param { CanvasRenderingContext2D } ctx - canvas context 
 * @param { string } font - font for text 
 * @param { string } fillStyle - font for text 
 * @param { number } shadowOffsetX - shadowOffsetX 
 * @param { number } shadowOffsetY - shadowOffsetY 
 * @returns { DisplayTextType }
*/
//FIXME: Clear The Preivous Text;
function DisplayText(txt,x,y,ctx,font = "20px Times New Roman", fillStyle = "Black" ,shadowOffsetX = 0,shadowOffsetY = 0){
  let _shadowOffsetX = shadowOffsetX ? shadowOffsetX : 0;
  let _shadowOffsetY =  shadowOffsetY ? shadowOffsetY : 0;

  ctx.shadowOffsetX = _shadowOffsetX;
  ctx.shadowOffsetY = _shadowOffsetY;
  ctx.fillStyle = fillStyle;
  ctx.font = font;
  ctx.fillText(txt,x,y);
  const displayText = {
    txt:txt,
    ctx:ctx,
    x:x,
    y:y,
    shadowOffsetX:_shadowOffsetX,
    shadowOffsetY:_shadowOffsetY,
    font:font
  };

  return displayText;

}

/** @param { DisplayTextType } t -- DisplayTextType */
const ClearText = (t)=>{
  if(t.txt ==="" || t.ctx === undefined || t.x === undefined || t.y === undefined){
    return
  }
  const textMetrics = t.ctx.measureText(t.txt);
  console.log("Text Metrics:- ",textMetrics);
  const boxStartX = t.x;
  const boxStartY = t.y - textMetrics.actualBoundingBoxAscent; 
  const textHeight = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;
  const textWidth = Math.round(textMetrics.actualBoundingBoxLeft + textMetrics.actualBoundingBoxRight);
  t.ctx.clearRect(boxStartX , boxStartY, textWidth + t.shadowOffsetX,textHeight + t.shadowOffsetY);
}

//Display mouse position.
/**
 *@param { HTMLCanvasElement } canvas  - Canvas
 * @param { CanvasRenderingContext2D } ctx - context
*/
async function DisplayCursorPosition(canvas,ctx){
  const x = 10;
  const y = 70;

  /** @type { DisplayTextType } */
  let prevText = {
    txt: "",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    x: 0,
    y: 0,
    ctx: undefined,
    font: ""
  };

  canvas.addEventListener("mousemove",(event)=>{
    ClearText(prevText);
    const text = `Mouse is at X: ${event.clientX}, Y: ${event.clientY}`;
    prevText = DisplayText(text,x,y,ctx);
  })
  canvas.addEventListener("mouseover",(event)=>{
    // console.log("Mouse Over",event);
  })
  canvas.addEventListener("mouseleave",(event)=>{
    ClearText(prevText);
  })
}

//Capture all keyboard input except keyboard reserved by browser and windows.
//Capture Mouse Input

/**
 * @returns { void }
*/
function canvas_render() {
  console.log("Rerendering canvas");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log(active_tab);
    switch (active_tab) {
      case 1:
        displayCanvasDimension(canvas,ctx);
        DisplayCursorPosition(canvas,ctx);
      case 2:
        ctx.fillStyle = "rgb(200 0 0)";
        ctx.fillRect(100, 100, 50, 50);
        ctx.fillStyle = "rgb(0 0 200 / 50%)";
        ctx.fillRect(130, 130, 50, 50);
        break;
      default:
        break;
    }
    requestAnimationFrame(canvas_render);

  } else {
    console.log("Unable to get context");
  }
}

/**
 * @param { ResizeObserverEntry[] } entries - entries array
 * @returns { void }
*/
function body_mutation_callback(entries) {
  const canvas = document.getElementsByTagName("canvas")[0];
  canvas.height = window.innerHeight;
  canvas.width = entries[0].contentBoxSize[0].inlineSize;
  canvas_render();
}

function main() {
  console.log("JS linked");

  /**@type { HTMLBodyElement } */
  const body_el = document.getElementsByTagName("body")[0];
  body_el.style.margin = "0px";

  canvas = document.createElement("canvas");
  body_el.appendChild(canvas);
  ctx = canvas.getContext("2d")

  /** @type { ResizeObserver } */
  const body_resize_observer = new ResizeObserver(body_mutation_callback);
  body_resize_observer.observe(document.documentElement);

  window.requestAnimationFrame(canvas_render)

  window.addEventListener("keydown",(e)=>{
    if(e.altKey){
      if(caputre_keyboard){
        e.preventDefault();
      }
      console.log(e);
      switch (e.code) {
        case 'Digit1':
          active_tab = 1;
          break;
        case 'Digit2':
          active_tab = 2;
          break;
        default:
          break;
      }
    }
  });
}

var active_tab = 1;
var caputre_keyboard = 1;

/** @type {HTMLCanvasElement | null} -- canvas*/
var canvas ;

/** @type {CanvasRenderingContext2D } */
var ctx ;
document.body.onload = main;
