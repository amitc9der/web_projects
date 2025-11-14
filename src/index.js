import { Router } from "./projects/client-side-router/index.js";
import loadPortfolio from "./projects/portfolio/index.js";

const AppContext = {};

async function main() {
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

  // Load portfolio configuration
  const config = await loadPortfolioConfig();

  // Generate router configuration dynamically from config
  const routerConfig = generateRouterConfig(config, main);
  
  const router = new Router(routerConfig, window);
  AppContext.router = router;
  window.AppContext = AppContext;

  // Callback to handle post-navigation actions
  const onNavigate = () => {
    if (AppContext.sidebar) {
      AppContext.sidebar.collapse();
    }
  };

  // Generate sidebar dynamically from config
  const sidebarItems = generateSidebarItems(config, router, onNavigate);
  const sidebar = createSidebar(sidebarItems);
  
  // Store sidebar in AppContext so it can be accessed globally
  AppContext.sidebar = sidebar;

  // Start with sidebar collapsed by default
  sidebar.collapse();

  //toggle sidebar visibility with keyboard
  document.addEventListener("keydown", (e) => {
    if (e.key === "`") sidebar.toggleVisibility(); // Press backtick ` to toggle
  });

}

/**
 * Load portfolio configuration from JSON
 */
async function loadPortfolioConfig() {
  try {
    const response = await fetch('/src/projects/portfolio/portfolio-config.json');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to load portfolio config:", error);
    // Return minimal config if loading fails
    return {
      projects: {
        items: []
      }
    };
  }
}

/**
 * Generate router configuration from portfolio config
 */
function generateRouterConfig(config, mainElement) {
  const routes = {
    "/": () => {
      loadPortfolio();
    }
  };

  // Extract all routes from projects
  if (config.projects && config.projects.items) {
    config.projects.items.forEach(project => {
      if (project.routes && Array.isArray(project.routes)) {
        project.routes.forEach(route => {
          routes[route.path] = () => {
            loadIframe(mainElement, route.file);
          };
        });
      }
    });
  }

  return routes;
}

/**
 * Generate sidebar items from portfolio config
 */
function generateSidebarItems(config, router, onNavigate = null) {
  const items = [
    {
      label: "Home",
      onClick: () => {
        router.navigate("/");
        if (onNavigate) onNavigate();
      },
    }
  ];

  // Group routes by category
  const categories = {};
  
  if (config.projects && config.projects.items) {
    config.projects.items.forEach(project => {
      const category = project.category || "Other";
      
      if (!categories[category]) {
        categories[category] = [];
      }

      if (project.routes && Array.isArray(project.routes)) {
        project.routes.forEach(route => {
          categories[category].push({
            label: route.name,
            onClick: () => {
              router.navigate(route.path);
              if (onNavigate) onNavigate();
            }
          });
        });
      }
    });
  }

  // Convert categories object to sidebar structure
  Object.keys(categories).sort().forEach(categoryName => {
    items.push({
      label: categoryName,
      children: categories[categoryName]
    });
  });

  return items;
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
  // Responsive width and font size based on screen size
  const isMobile = window.innerWidth < 768;
  const {
    width = isMobile ? "80vw" : "250px",
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
      width: isMobile ? "60px" : "3em",
      height: isMobile ? "60px" : "3em",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "all 0.2s ease",
      position: "relative",
      zIndex: "9999",
      boxShadow: "2px 2px 0px rgba(139, 111, 71, 0.3)",
      marginBottom: isMobile ? "1.5em" : "1em",
    },
  });

  // Insert your SVG inside the button with retro color
  const svgSize = isMobile ? "32px" : "24px";
  collapseBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" height="${svgSize}" viewBox="0 -960 960 960" width="${svgSize}" fill="#3d2817"><path d="M120-680v-80h720v80H120Zm0 480v-80h720v80H120Zm0-240v-80h720v80H120Z"/></svg>
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
          padding: isMobile ? "1.5em 1.2em" : "0.6em 0.8em",
          cursor: "pointer",
          whiteSpace: "nowrap",
          userSelect: "none",
          marginBottom: isMobile ? "0.8em" : "0.3em",
          border: "1px solid transparent",
          transition: "all 0.2s ease",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: isMobile ? "20px" : "0.9em",
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
            marginLeft: isMobile ? "1.5em" : "1em",
            borderLeft: isMobile ? "3px solid #d4c4a8" : "2px solid #d4c4a8",
            paddingLeft: isMobile ? "1.2em" : "0.8em",
            marginTop: isMobile ? "0.8em" : "0.3em",
            marginBottom: isMobile ? "1em" : "0.5em",
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
    collapse() {
      if (!collapsed) {
        collapsed = true;
        sidebar.style.width = "4em";
        sidebar.style.height = "4em";
        sidebar.style.top = "1em";
        sidebar.style.borderRadius = "0 0.5em 0.5em 0";
        sidebar.style.overflow = "hidden";
        sidebar.style.borderRight = "3px solid #8b6f47";
        sidebar.style.borderBottom = "3px solid #8b6f47";
        Array.from(sidebar.children)
          .filter((c) => c !== collapseBtn)
          .forEach((el) => (el.style.display = "none"));
      }
    },
    expand() {
      if (collapsed) {
        collapsed = false;
        sidebar.style.width = width;
        sidebar.style.height = "100vh";
        sidebar.style.top = "0";
        sidebar.style.borderRadius = "0";
        sidebar.style.overflow = "auto";
        sidebar.style.borderBottom = "none";
        Array.from(sidebar.children)
          .filter((c) => c !== collapseBtn)
          .forEach((el) => (el.style.display = "block"));
      }
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
