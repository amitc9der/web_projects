// @ts-ignore
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

// import { body_mutation_callback } from "../canvas_exploration";
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

let cursor_position = { x: 0, y: 0 };
let lastFrameTime = 0;
const targetFPS = 30;
const frameInterval = 1000 / targetFPS; // milliseconds per frame

/** @type { WebGLRenderingContext | null} */
let gl = null;

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

/**
 * @param { HTMLDivElement} main - main div element 
 * @returns { void }
 */
window.addEventListener("DOMContentLoaded", () => {
    const main = document.body; // or document.querySelector("main") if you use a <main> tag

    main.innerHTML = "";
    //Create Canvas Element
    let canvas = document.createElement("canvas");
    main.appendChild(canvas);

    // GetContext
    let ctx = canvas.getContext("2d");
    let requestId = window.requestAnimationFrame((timestamp) => {
        canvas_render(canvas, ctx, requestId, timestamp);
    });

    requestId && window.cancelAnimationFrame(requestId);
    const _canvas = document.createElement("canvas");
    canvas && canvas.replaceWith(_canvas);
    canvas = _canvas;
    gl = canvas.getContext("webgl");
    // console.log(gl);
    setupCanvas(canvas);
    requestId = window.requestAnimationFrame((timestamp) => {
        canvas_render(canvas, ctx, requestId, timestamp);
    });
});

/**
 * @param {WebGLRenderingContext} _gl
 */
function render_tab_2(_gl) {
    if (!cubeProgramInfo) initCube(_gl);

    _gl.clearColor(0, 0, 0, 1);
    _gl.clearDepth(1.0);
    _gl.enable(_gl.DEPTH_TEST);
    _gl.depthFunc(_gl.LEQUAL);
    _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
    _gl.viewport(0, 0, _gl.canvas.width, _gl.canvas.height);

    const fov = 45 * Math.PI / 180;
    const aspect = (_gl.canvas instanceof HTMLCanvasElement) ? _gl.canvas.clientWidth / _gl.canvas.clientHeight : 1;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -6]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 0, 1]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [0, 1, 0]);

    {
        const numComponents = 3;
        const type = _gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeBufferInfo.position);
        _gl.vertexAttribPointer(
            cubeProgramInfo.attribLocations.vertexPosition,
            numComponents, type, normalize, stride, offset);
        _gl.enableVertexAttribArray(cubeProgramInfo.attribLocations.vertexPosition);
    }

    {
        const numComponents = 4;
        const type = _gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeBufferInfo.color);
        _gl.vertexAttribPointer(
            cubeProgramInfo.attribLocations.vertexColor,
            numComponents, type, normalize, stride, offset);
        _gl.enableVertexAttribArray(cubeProgramInfo.attribLocations.vertexColor);
    }

    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, cubeBufferInfo.indices);

    _gl.useProgram(cubeProgramInfo.program);
    _gl.uniformMatrix4fv(cubeProgramInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    _gl.uniformMatrix4fv(cubeProgramInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    const vertexCount = 36;
    const type = _gl.UNSIGNED_SHORT;
    const offset = 0;
    _gl.drawElements(_gl.TRIANGLES, vertexCount, type, offset);

    cubeRotation += 0.02;
}
/**
 * @returns { void }
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
        gl && render_tab_2(gl);
    }
    requestId = window.requestAnimationFrame((timestamp) => {
        canvas_render(canvas, ctx, requestId, timestamp);
    });
}


/**
 * @param {WebGLRenderingContext} gl
 */
function initBuffers(gl) {
    // Create cube vertices
    const positions = [
        // Front face
        -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
        // Back face
        -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1,
        // Top
        -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
        // Bottom
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
        // Right
        1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
        // Left
        -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1,
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Colors for faces
    const faceColors = [
        [1, 0, 0, 1],
        [0, 1, 0, 1],
        [0, 0, 1, 1],
        [1, 1, 0, 1],
        [1, 0, 1, 1],
        [0, 1, 1, 1],
    ];
    let colors = [];
    for (const c of faceColors) {
        colors = colors.concat(c, c, c, c);
    }
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Element indices
    const indices = [
        0, 1, 2, 0, 2, 3,  // front
        4, 5, 6, 4, 6, 7,  // back
        8, 9, 10, 8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23, // left
    ];
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };
}

/**
 * Cube rotation state
 */
let cubeRotation = 0;
let cubeBufferInfo = null;
let cubeProgramInfo = null;

/**
 * @param {WebGLRenderingContext} _gl
 */
function initCube(_gl) {
    // Vertex shader
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        varying lowp vec4 vColor;
        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
        }
    `;

    // Fragment shader
    const fsSource = `
        varying lowp vec4 vColor;
        void main(void) {
            gl_FragColor = vColor;
        }
    `;

    const shaderProgram = initShaderProgram(_gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: _gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: _gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: _gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: _gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    const buffers = initBuffers(_gl);
    cubeProgramInfo = programInfo;
    cubeBufferInfo = buffers;
}

/**
 * Create shader program
 */
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize shader program:', gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}