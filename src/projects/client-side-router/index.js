/**
 * Router class for managing client-side routes.
 * 
 * @example
 * import { Router } from "./router.js";
 * 
 * const router = new Router({
 *   "/": () => renderHomePage(),
 *   "/about": () => renderAboutPage(),
 *   "*": () => renderNotFound(),
 * }, window);
 * 
 * router.navigate("/about");
*/
//router.js
export class Router{ 
   /**
	   * Creates a new Router instance.
	   * 
	   * @param {Object.<string, Function>} routes - A mapping of URL paths to handler functions.
	   * @param {Window} windowObj - The global window object to attach event listeners to.
   */
	constructor(routes,windowObj){
		this.routes = routes;
		windowObj.addEventListener("hashchange", ()=>this.handleRoute());
		this.handleRoute();
	}

	/**
	   * Navigates to a new path without reloading the page.
	   * 
	   * @param {string} path - The target URL path (e.g., "/home" or "/about").
	   * @example
	   * router.navigate("/about");
	*/
	navigate(path){
		if (this.routes[path]){
			window.location.hash = path;
		}
		else{
			console.warn(`Route not found: ${PATH}`);
			if (this.routes["*"]){
				window.location.hash = "*";
			}
		}
	}

	/**
   * Internal method: Determines the current route and executes its handler.
   * If the path is not defined in `routes`, it attempts to call the wildcard route (`"*"`).
   * 
   * @private
   */
	handleRoute(){
		const path = window.location.hash.replace(/^#/,"") || "/";
		const route = this.routes[path] || this.routes["*"];
		if (route) route();
	}
}
