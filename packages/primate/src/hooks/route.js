import {keymap} from "runtime-compat/object";
import {tryreturn} from "runtime-compat/sync";
import {is} from "runtime-compat/dyndef";
import errors from "../errors.js";

// insensitive-case equal
const ieq = (left, right) => left.toLowerCase() === right.toLowerCase();

/* routes may not contain dots */
export const invalid = route => /\./u.test(route);

const check_type = (type, value) => {
  if (type.type) {
    return type.type(value) === true;
  }
  is(type).function();
  return type(value) === true;
};

export default app => {
  const {types, routes, config: {explicit, paths}} = app;

  const isType = (groups, pathname) => Object
    .entries(groups ?? {})
    .map(([name, value]) =>
      [types[name] === undefined || explicit ? name : `${name}$${name}`, value])
    .filter(([name]) => name.includes("$"))
    .map(([name, value]) => [name.split("$")[1], value])
    .every(([name, value]) =>
      tryreturn(_ => check_type(types[name], value))
        .orelse(({message}) => errors.MismatchedPath.throw(pathname, message)));
  const isPath = ({route, pathname}) => {
    const result = route.pathname.exec(pathname);
    return result === null ? false : isType(result.groups, pathname);
  };
  const isMethod = ({route, method, pathname}) => ieq(route.method, method)
    && isPath({route, pathname});
  const find = (method, pathname) => routes.find(route =>
    isMethod({route, method, pathname}));

  const index = path => `${paths.routes}${path === "/" ? "/index" : path}`;
  const deroot = pathname => pathname.endsWith("/") && pathname !== "/"
    ? pathname.slice(0, -1) : pathname;

  return ({original: {method}, url}) => {
    const pathname = deroot(url.pathname);
    const route = find(method, pathname) ??
      errors.NoRouteToPath.throw(method, pathname, index(pathname));

    const path = app.dispatch(keymap(route.pathname?.exec(pathname).groups,
      key => key.split("$")[0]));

    return {...route, path};
  };
};
