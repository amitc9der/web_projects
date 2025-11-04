import { Router } from "./projects/client-side-router/index.js";

function main() {
  console.log("JS linked");

  /**@type { HTMLBodyElement } */
  const body_el = document.getElementsByTagName("body")[0];
  body_el.style.margin = "0px";

 // Create header
  const header = createEl("div", {
    style: {
      height: "60px",
      background: "#ccc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
    },
    attrs: { id: "header" },
  });

  // Create main area
  const main = createEl("div", {
    style: {
      flex: "1",
      background: "#eee",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    attrs: { id: "main" },
  });

  // Create root container
  const root = createEl("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
    },
    attrs: { id: "root" },
    children: [header, main],
  });

  //create a main div
  body_el.appendChild(root);

  //Setup Client Side Router
  const router = new Router({
    "/": () => {
      main.innerHTML = "";
    },
    "/pong": () => {
      main.innerHTML = "";

      const iframe = document.createElement("iframe");
      iframe.src = "/src/projects/raylib/pong/game.html";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";

      main.appendChild(iframe);
    },
    "/showPosition": () => {
      main.innerHTML = "";

      const iframe = document.createElement("iframe");
      iframe.src = "/src/projects/canvas_exploration/index.html";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";

      main.appendChild(iframe);
    },
    "/webGL": () => {
      main.innerHTML = "";

      const iframe = document.createElement("iframe");
      iframe.src = "/src/projects/webGL/index.html";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";

      main.appendChild(iframe);
    },
  }, window);



  const home_button = document.createElement("button");
  home_button.textContent = "Go Home";
  home_button.onclick = () => router.navigate("/");
  header.appendChild(home_button);

  const pong_button = document.createElement("button");
  pong_button.textContent = "Pong";
  pong_button.onclick = () => router.navigate("/pong");
  header.appendChild(pong_button);

  const show_position_button = document.createElement("button");
  show_position_button.textContent = "Show Position";
  show_position_button.onclick = () => router.navigate("/showPosition");
  header.appendChild(show_position_button);

  const webGL_button = document.createElement("button");
  webGL_button.textContent = "WebGL Example";
  webGL_button.onclick = () => router.navigate("/webGL");
  header.appendChild(webGL_button);


}

function createEl(tag, { style = {}, attrs = {}, children = [] } = {}) {
  const el = document.createElement(tag);
  // @ts-ignore
  Object.assign(el.style, style);
  // @ts-ignore
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  children.forEach((child) => el.appendChild(child));
  return el;
}


document.body.onload = main;