# Svelte handler

The [Svelte handler module][repository] has support for SSR and hydration and
serves Svelte components with the  `.svelte` extension.

## Install

`npm i @primate/svelte`

## Load

Import and initialize the module in your configuration.

```js file=primate.config.js
import svelte from "@primate/svelte";

export default {
  modules: [svelte()],
};
```

If you use a bundler, specify an array of entry points.

```js file=primate.config.js
import svelte from "@primate/svelte";

export default {
  modules: [svelte({entryPoints: ["PostIndex.svelte"]})],
};
```

## Use

Create a Svelte component in `components`.

```html file=components/PostIndex.svelte
<script>
  export let posts;
</script>
<h1>All posts</h1>
{#each posts as {id, title}}
<h2><a href="/svelte/post/{id}">{title}</a></h2>
{/each}

<style>
  button {
    border-radius: 4px;
    background-color: #5ca1e1;
    border: none;
    color: #fff;
    display: block;
  }
</style>
```

Create a route and serve the Svelte `PostIndex` component.

```js file=routes/svelte.js
import {view} from "primate";

const posts = [{
  id: 1,
  title: "First post",
}];

export default {
  get() {
    return view("PostIndex.svelte", {posts});
  },
};
```

Your rendered Svelte route will be accessible at
http://localhost:6161/svelte.

## Configuration options

### directory

Directory where the Svelte components reside. Defaults to
`config.paths.components`.

### entryPoints

Array of component names that serve as entry points. This information is
valuable to a bundle for deciding what files are relevant as starting input for
bundling.

[repository]: https://github.com/primatejs/primate/tree/master/packages/svelte