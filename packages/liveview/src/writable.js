import crypto from "runtime-compat/crypto";
import live from "./live.js";

export default initial_value => {
  let value = initial_value;
  const subscribers = [];
  return {
    id: crypto.randomUUID(),
    value,
    set(next) {
      value = next;
      subscribers.map(subscriber => subscriber(next));
    },
    subscribe(subscriber) {
      subscribers.push(subscriber);
    },
    live,
  };
};
