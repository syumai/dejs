# dejs

- dejs is [ejs](https://ejs.co) template engine for [deno](https://github.com/denoland/deno).
- dejs's render function returns `Reader`.

## Features

### Supported

- <%= %> Escaped
- <%- %> Raw
- <%# %> Comment
- <% %> Evaluate (Basic support)

### Not supported

- All other features of ejs

## Usage

- `renderFile(filePath: string, params: Params): Promise<Reader>`
  - render from file
- `render(body: string, params: Params): Promise<Reader>`
  - render from string
- `compile(reader: Reader): Promise<Template>`
  - only compiles ejs and returns `Template(params: Params): Promise<Reader>`
  - use this to cache compiled result of ejs

### Render from file

- template.ejs

```ejs
<body>
  <h1>hello, <%= name %>!</h1>
  <%# Example comment %>
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

- index.ts

```ts
import { cwd, stdout, copy } from 'deno';
import { render } from 'https://syumai.github.io/dejs/dejs.ts';

const template = `<body>
  <h1>hello, <%= name %>!</h1>
  <%# Example comment %>
</body>`;

(async () => {
  const output = await render(template, {
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

## Author

syumai

## License

MIT
