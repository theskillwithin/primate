export default (length, {host, port}) => {
  const n = length - 1;
  const body = Array.from({length: n}, (_, i) => i - 1)
    .reduceRight((child, _, i) => `components[${i + 1}] !== undefined
        ? createElement(components[${i}], {...data[${i}]}, ${child})
        : createElement(components[${i}], {...data[${i}]})
    `, `createElement(components[${n}], {...data[${n}]})`);

  return `
    import React from "react";
    const {createElement, useState, useEffect} = React;

    export default function Root({components, data: $data, subscribers}) {
    console.log("TEST", $data);
      const [data, setData] = useState($data);

      if (globalThis.document !== undefined) {
        useEffect(() => {
          const ws = new WebSocket("ws://${host}:${port}/$live");
          ws.addEventListener("open", () => {
            ws.send(JSON.stringify({
              name: "subscribe",
              id: "ME",
              vals: subscribers.flat(),
            }));
          });
          ws.addEventListener("message", message => {
            setData(data => {
              for (const {at, val} of JSON.parse(message.data)) {
                data[at] = val;
              }
              return [...data];
            });
          });
        }, []);
      }

      return ${body};
    };
  `;
};
