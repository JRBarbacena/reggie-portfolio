import {
  CACHE_IDENTITY, CACHE_NAMESPACE, OPTIONAL_SHELL, REQUIRED_SHELL,
} from "./generated/cache-manifest.js";
import { PRODUCT_ROUTE_LIST, ROUTE_ALIASES } from "./generated/routes.js";

export { CACHE_IDENTITY, OPTIONAL_SHELL, REQUIRED_SHELL };
export const CACHE_PREFIX = `${CACHE_NAMESPACE}-`;
export const BUILD_ID = CACHE_IDENTITY;
export const SHELL_CACHE = `${CACHE_PREFIX}shell-${BUILD_ID}`;
export const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${BUILD_ID}`;
export const PRODUCT_ROUTES = new Set(PRODUCT_ROUTE_LIST.map(({ route }) => route));

export function normalizeRoute(input, origin = "https://portfolio.invalid") {
  const url = new URL(input, origin);
  return ROUTE_ALIASES[url.pathname] || url.pathname.replace(/\/$/, "") || "/";
}

export function isCacheable(request, response, origin) {
  return request.method === "GET" && new URL(request.url).origin === origin && response?.ok && response.type !== "opaque";
}