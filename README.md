# dejs

- [ejs](https://ejs.co) template engine for [deno](https://github.com/denoland/deno).

## Features

### Supported

- <%= %> Output escaped value
- <%- %> Output raw value
- <%# %> Comment (nothing will be shown)
- <% %> Evaluate (use control flow like: if, for)

### Not supported

- All other features of ejs

## Usage

- `renderFile(filePath: string, params: Params): Promise<Reader>`
  - render from file
- `render(body: string, params: Params): Promise<Reader>`
  - render from string
- `compile(reader: Reader): Promise<Template>`
  - only compiles ejs and returns `Template(params: Params): Reader`
  - use this to cache compiled result of ejs

### Render from file

- template.ejs

```ejs
<body>
  <% if (name) { %>
    <h1>hello, <%= name %>!</h1>
  <% } %>
</body>
```

- index.ts

```ts
import { cwd, stdout, copy } from 'deno';
import { renderFile } from 'https://syumai.github.io/dejs/dejs.ts';

(async () => {
  const output = await renderFile(`${cwd()}/template.ejs`, {
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

### Render from string

```ts
import { cwd, stdout, copy } from 'deno';
import { render } from 'https://syumai.github.io/dejs/dejs.ts';

const template = `<body>
  <% if (name) { %>
    <h1>hello, <%= name %>!</h1>
  <% } %>
</body>`;

(async () => {
  const output = await render(template, {
    name: 'world',
  });
  await copy(stdout, output);
})();
```

## Author

syumai

## License

MIT
