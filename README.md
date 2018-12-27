# dpl

- [**d**eno](https://github.com/denoland/deno) tem**pl**ate engine.
- dpl behaves as [ejs](https://ejs.co) parser currently.

## Status

- <%= %> ... Basic support
- <%- %> ... Basic support
- <% %> ... WIP
- <%# %> ... WIP

## Usage

- template.ejs

```html
<body>
  <h1>hello, <%= name %>!</h1>
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
