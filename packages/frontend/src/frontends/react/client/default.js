import rootname from "./rootname.js";
import liveview from "./liveview.js";

export default ({names, data, subscribers}, options) => `
  import * as components from "app";
  import {hydrateRoot, createElement} from "app";

  const root = hydrateRoot(globalThis.window.document.body,
    createElement(components.${rootname}, {
      components: [${names.map(name => `components.${name}`).join(", ")}],
      data: JSON.parse(${JSON.stringify(JSON.stringify(data))}),
      subscribers: JSON.parse(${JSON.stringify(JSON.stringify(subscribers))}),
    })
  );
  ${options.liveview ? liveview : ""}`;
