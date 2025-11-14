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
    },
    "/algo/bubble_sort": () => {
      loadIframe(main, "/src/projects/algorithm_visualization/bubble_sort/index.html")
    },
    "/algo/merge_sort": () => {
      loadIframe(main, "/src/projects/algorithm_visualization/merge_sort/index.html")
    }
  }, window);
  AppContext.router = router;
  window.AppContext = AppContext;

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
    {
      label: "Algorithms",
      children: [
        { label: "Bubble Sort", onClick: () => router.navigate("/algo/bubble_sort") },
        { label: "Merge Sort", onClick: () => router.navigate("/algo/merge_sort") },
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
    fontFamily = "'Courier New', monospace",
    background = "#faf8f3",
    color = "#3d2817",
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
      backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px),
        repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
      `,
      color,
      fontFamily,
      overflowY: "auto",
      transition: "width 0.3s ease, opacity 0.3s ease",
      zIndex,
      display: "flex",
      flexDirection: "column",
      padding: "1em",
      boxSizing: "border-box",
      borderRight: "3px solid #8b6f47",
      boxShadow: "4px 0 10px rgba(0, 0, 0, 0.1)",
    },
    attrs: { id: "floating-sidebar" },
  });

  const collapseBtn = createEl("button", {
    style: {
      background: "#e8ddd4",
      border: "2px solid #8b6f47",
      cursor: "pointer",
      width: "3em",
      height: "3em",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "all 0.2s ease",
      position: "relative",
      zIndex: "9999",
      boxShadow: "2px 2px 0px rgba(139, 111, 71, 0.3)",
      marginBottom: "1em",
    },
  });

  // Insert your SVG inside the button with retro color
  collapseBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#3d2817"><path d="M120-680v-80h720v80H120Zm0 480v-80h720v80H120Zm0-240v-80h720v80H120Z"/></svg>
`

  collapseBtn.onmouseenter = () => {
    Object.assign(collapseBtn.style, {
      transform: "translate(-2px, -2px)",
      boxShadow: "4px 4px 0px rgba(139, 111, 71, 0.4)",
    });
  };

  collapseBtn.onmouseleave = () => {
    Object.assign(collapseBtn.style, {
      transform: "translate(0, 0)",
      boxShadow: "2px 2px 0px rgba(139, 111, 71, 0.3)",
    });
  };

  collapseBtn.onclick = () => {
    collapsed = !collapsed;
    if (collapsed) {
      sidebar.style.width = "4em";
      sidebar.style.height = "4em";
      sidebar.style.top = "1em";
      sidebar.style.borderRadius = "0 0.5em 0.5em 0";
      sidebar.style.overflow = "hidden";
      sidebar.style.borderRight = "3px solid #8b6f47";
      sidebar.style.borderBottom = "3px solid #8b6f47";
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
      sidebar.style.borderBottom = "none";
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
          padding: "0.6em 0.8em",
          cursor: "pointer",
          whiteSpace: "nowrap",
          userSelect: "none",
          marginBottom: "0.3em",
          border: "1px solid transparent",
          transition: "all 0.2s ease",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "0.9em",
          fontWeight: "600",
        },
        children: [document.createTextNode(item.label)],
      });
      itemEl.onclick = item.onClick || null;
      itemEl.onmouseenter = () => {
        Object.assign(itemEl.style, {
          background: "#e8ddd4",
          border: "1px solid #8b6f47",
          boxShadow: "2px 2px 0px rgba(139, 111, 71, 0.2)",
          transform: "translateX(3px)",
        });
      };
      itemEl.onmouseleave = () => {
        Object.assign(itemEl.style, {
          background: "transparent",
          border: "1px solid transparent",
          boxShadow: "none",
          transform: "translateX(0)",
        });
      };

      parent.appendChild(itemEl);

      if (item.children && item.children.length > 0) {
        const nested = createEl("div", {
          style: {
            marginLeft: "1em",
            borderLeft: "2px solid #d4c4a8",
            paddingLeft: "0.8em",
            marginTop: "0.3em",
            marginBottom: "0.5em",
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
