# dpl

- [**d**eno](https://github.com/denoland/deno) tem**pl**ate engine.
- dpl behaves as [ejs](https://ejs.co) parser currently.

## Status

- <%= %> Escaped => Basic support
- <%- %> Raw => Basic support
- <%# %> Comment => Supported
- <% %> ... WIP

## Usage

- template.ejs

```html
<body>
  <h1>hello, <%= name %>!</h1>
  <%# Example comment %>
</body>
```

- index.ts

```ts
import { cwd, stdout, copy } from 'deno';
import { render } from 'https://syumai.github.io/dpl/dpl.ts';

(async () => {
  const output = await render(`${cwd()}/template.ejs`, {
    name: 'world',
  });
  await copy(stdout, output);
})();
```

- console

```sh
$ deno index.ts
<body>
  <h1>hello, world!</h1>
</body>
```
