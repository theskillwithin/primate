export default length => {
  const n = length - 1;
  const body = Array.from({length: n}, (_, i) => i - 1)
    .reduceRight((child, _, i) => `components[${i + 1}] !== undefined
        ? createElement(components[${i}], {...data[${i}]}, ${child})
        : createElement(components[${i}], {...data[${i}]})
    `, `createElement(components[${n}], {...data[${n}]})`);

  return `
    import React from "react";
    const {createElement} = React;
    import {ReactHeadContext, is} from "@primate/frontend";

    export default function Root({components, data, push_head: value}) {
      return is.client
        ? ${body}
        : createElement(ReactHeadContext.Provider, {value}, ${body});
    };
  `;
};
