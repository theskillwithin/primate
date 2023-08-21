import {WebSocketServer} from "ws";
import {URL, Request} from "runtime-compat/http";
import header from "./client/header.js";
import live from "./live.js";

export default _ => {
  return {
    name: "primate:liveview",
    init(app, next) {
      const live2 = {
        subscribers: {},
        subscribe({ids, socket}) {
          ids.forEach(id => {
            const current = this.subscribers[id];
            this.subscribers[id] = current ? [...current, socket] : [socket];
          })
        },
        send(id, val) {
          const listeners = this.subscribers[id];
          listeners?.forEach(listener => {
            listener.send(JSON.stringify([{id, val}]))
          })
        },
      };
      return next({...app, live, live2, liveview: {header}});
    },
    async publish(app, next) {
      await app.import("@primate/liveview");
      app.export({
        type: "script",
        code: "export {default as liveview} from \"@primate/liveview\";\n",
      });
      return next(app);
    },
    serve(app, next) {
      const wss = new WebSocketServer({noServer: true});
      const up = response => socket => wss.emit("connection", socket, response);

      wss.on("connection", async (socket, response) => {
        /*const updates = [
          {at: 0, id: "1", val: {hello: "WORLD"}}
        ];
        socket.send(JSON.stringify(updates));*/
        socket.on("message", async data => {
          const {name, ...event_data} = JSON.parse(data.toString("utf8"));
          if (name === "subscribe") {
            app.live2.subscribe({...event_data, socket});
          }
        });
      });

      app.server.addListener("upgrade", async (req, socket, head) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const request = new Request(`${url}`, {
          headers: req.headers,
          method: "ws",
          body: req,
        });
        try {
          const parsed = await app.parse(request);
          if (parsed.url.pathname === "/$live") {
            wss.handleUpgrade(req, socket, head, up());
          }
        } catch (error) {
          socket.destroy();
          if (error.level !== undefined) {
            app.log.auto(error);
          }
        }
      });
      return next(app);
    },
  };
};
