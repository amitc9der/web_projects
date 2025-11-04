import { Router } from "./projects/client-side-router/index.js";
import loadPortfolio from "./projects/portfolio/index.js";

const AppContext = {};
function main() {
  console.log("JS linked");

  /**@type { HTMLBodyElement } */
  const body_el = document.getElementsByTagName("body")[0];
  body_el.style.margin = "0px";

  const main = document.createElement("div");
  main.id = "main"
  main.style.display = "flex";
  main.style.height = "100vh";
  main.style.width = "100vw";
  main.style.overflow = "hidden";
  body_el.appendChild(main);

  //Setup Client Side Router
  const router = new Router({
    "/": () => {
      loadPortfolio();
    },
    "/pong": () => {
      loadIframe(main, "/src/projects/raylib/pong/game.html")
    },
    "/showPosition": () => {
      loadIframe(main, "/src/projects/canvas_exploration/index.html")
    },
    "/webGL": () => {
      loadIframe(main, "/src/projects/webGL/index.html")
    }
  }, window);
  AppContext.router = router;

  const sidebar = createSidebar([
    {
      label: "Home",
      onClick: () => router.navigate("/"),
    },
    {
      label: "Games",
      children: [
        { label: "Pong", onClick: () => router.navigate("/pong") },
        { label: "WebGL Demo", onClick: () => router.navigate("/webGL") },
      ],
    },
    {
      label: "Tools",
      children: [
        { label: "Show Position", onClick: () => router.navigate("/showPosition") },
      ],
    },
  ]);

  //toggle sidebar visibility with keyboard
  document.addEventListener("keydown", (e) => {
    if (e.key === "`") sidebar.toggleVisibility(); // Press backtick ` to toggle
  });

}



document.body.onload = main;

/**
 * @param {HTMLDivElement} main 
 * @param {string} src 
 */
function loadIframe(main, src) {
  main.innerHTML = "";
  const iframe = document.createElement("iframe");
  // @ts-ignore
  Object.assign(iframe.style, {
    width: "100%",
    height: "100%",
    border: "none",
  });
  iframe.src = src;
  main.appendChild(iframe);
}




function createSidebar(items = [], options = {}) {
  const {
    width = "250px",
    zIndex = 9999,
    fontFamily = "monospace",
    background = "rgba(0, 0, 0, 0.85)",
    color = "white",
  } = options;

  let collapsed = false;
  let visible = true;

  const sidebar = createEl("div", {
    style: {
      position: "fixed",
      top: "0",
      left: "0",
      height: "100vh",
      width,
      background,
      color,
      fontFamily,
      overflowY: "auto",
      transition: "width 0.3s ease, opacity 0.3s ease",
      zIndex,
      display: "flex",
      flexDirection: "column",
      padding: "0.5em",
      boxSizing: "border-box",
      borderRight: "1px solid rgba(255,255,255,0.1)",
    },
    attrs: { id: "floating-sidebar" },
  });

  const collapseBtn = createEl("button", {
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      width: "3em",
      height: "3em",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: "0.4em",
      transition: "background 0.2s, transform 0.2s",
      position: "relative",
      zIndex: "9999",
    },
  });

  // Insert your SVG inside the button
  collapseBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M120-680v-80h720v80H120Zm0 480v-80h720v80H120Zm0-240v-80h720v80H120Z"/></svg>
`

  collapseBtn.onclick = () => {
    collapsed = !collapsed;
    if (collapsed) {
      sidebar.style.width = "4em";
      sidebar.style.height = "4em";
      sidebar.style.top = "1em";
      sidebar.style.borderRadius = "0 0.5em 0.5em 0";
      sidebar.style.overflow = "hidden";
      /**@ts-ignore */
      Array.from(sidebar.children)
        .filter((c) => c !== collapseBtn)
        .forEach((el) => (el.style.display = "none"));
    } else {
      sidebar.style.width = width;
      sidebar.style.height = "100vh";
      sidebar.style.top = "0";
      sidebar.style.borderRadius = "0";
      sidebar.style.overflow = "auto";
      /**@ts-ignore */
      Array.from(sidebar.children)
        .filter((c) => c !== collapseBtn)
        .forEach((el) => (el.style.display = "block"));
    }
  };

  sidebar.appendChild(collapseBtn);

  // Recursive renderer for nested menu items
  function renderItems(parent, list) {
    list.forEach((item) => {
      const itemEl = createEl("div", {
        style: {
          padding: "0.3em 0.6em",
          cursor: "pointer",
          whiteSpace: "nowrap",
          userSelect: "none",
        },
        children: [document.createTextNode(item.label)],
      });
      itemEl.onclick = item.onClick || null;
      itemEl.onmouseenter = () => (itemEl.style.background = "rgba(255,255,255,0.1)");
      itemEl.onmouseleave = () => (itemEl.style.background = "transparent");

      parent.appendChild(itemEl);

      if (item.children && item.children.length > 0) {
        const nested = createEl("div", {
          style: {
            marginLeft: "1em",
            borderLeft: "1px solid rgba(255,255,255,0.2)",
            paddingLeft: "0.5em",
          },
        });
        renderItems(nested, item.children);
        parent.appendChild(nested);
      }
    });
  }

  renderItems(sidebar, items);
  document.body.appendChild(sidebar);


  return {
    element: sidebar,
    toggleVisibility() {
      visible = !visible;
      sidebar.style.opacity = visible ? "1" : "0";
      sidebar.style.pointerEvents = visible ? "auto" : "none";
    },
    show() {
      visible = true;
      sidebar.style.opacity = "1";
      sidebar.style.pointerEvents = "auto";
    },
    hide() {
      visible = false;
      sidebar.style.opacity = "0";
      sidebar.style.pointerEvents = "none";
    },
  };
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
