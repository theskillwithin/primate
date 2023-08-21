export default (length, {host, port}) => {
  const n = length - 1;
  const body = Array.from({length: n}, (_, i) => i - 1)
    .reduceRight((child, _, i) => `
      {#if components[${i + 1}]}
        <svelte:component this={components[${i}]} {...data[${i}]}>
          ${child}
        </svelte:component>
      {:else}
        <svelte:component this={components[${i}]} {...data[${i}]} />
      {/if}
    `, `<svelte:component this={components[${n}]} {...data[${n}]} />`);

  return `
    <script>
      import {afterUpdate, onMount} from "svelte";
      export let components;
      export let data;
      export let subscribers;
      export let update = () => undefined;

      onMount(() => {
        const map = {};
        const ws = new WebSocket("ws://${host}:${port}/$live");
        const ids = subscribers.flat().flatMap(o => Object.values(o));
        subscribers.forEach((subscriber, i) => {
          const entries = Object.entries(subscriber);
          if (entries.length > 0) {
            map[entries[0][1]] = {
              position: i,
              property: entries[0][0],
            };
          }
        })
        ws.addEventListener("open", () => {
          ws.send(JSON.stringify({name: "subscribe", ids}));
        });
        ws.addEventListener("message", message => {
          const updates = JSON.parse(message.data);
          for (const {id, val} of updates) {
            const {position: at, property} = map[id];
            data[at][property] = val;
          }
        })
      });

      afterUpdate(update);
    </script>
    ${body}
  `;
};
