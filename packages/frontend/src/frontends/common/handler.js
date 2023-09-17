import {Response, Status, MediaType} from "runtime-compat/http";
import {map} from "runtime-compat/async";
import {valmap} from "runtime-compat/object";
import register from "./register.js";

export default config => {
  const {make, root, render, client, normalize} = register(config);

  const get_names = components => map(components, ({name}) => normalize(name));

  return (name, props = {}, {status = Status.OK, page} = {}) =>
    async (app, {layouts = [], as_layout} = {}, request) => {
      const options = {
        liveview: app.liveview !== undefined,
      };
      const {headers} = request;
      if (as_layout) {
        return make(name, props);
      }
      const components = (await Promise.all(layouts.map(layout =>
        layout(app, {as_layout: true}, request)
      )))
        /* set the actual page as the last component */
        .concat(await make(name, props));

      const data = components.map(component => component.props);
      const names = await get_names(components);

      if (options.liveview && headers.get(app.liveview.header) !== undefined) {
        return new Response(JSON.stringify({names, data}), {
          status,
          headers: {...await app.headers(),
            "Content-Type": MediaType.APPLICATION_JSON},
        });
      }

      const subscribers = data.map(datum => {
        return Object.fromEntries(Object.entries(datum)
          .filter(([, value]) => value.live !== undefined)
          .map(([key, value]) => {
            value.subscribe(next => app.live2.send(value.id, next));
            return [key, value.id];
          }));
      });

      const flattened_data = data.map(datum =>
        valmap(datum, value => value?.live === undefined ? value : value.value)
      );

      const imported = (await import(root)).default;
      const {body, head} = render(imported, {
        components: components.map(({component}) => component),
        data: flattened_data,
        subscribers,
      });

      const code = client({names, data: flattened_data, subscribers}, options);

      await app.publish({code, type: "module", inline: true});
      // needs to be called before app.render
      const headers$ = await app.headers();

      return new Response(await app.render({body, page, head}), {
        status,
        headers: {...headers$, "Content-Type": MediaType.TEXT_HTML},
      });
    };
};
