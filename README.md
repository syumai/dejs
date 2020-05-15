# dejs

[![Build Status](https://github.com/syumai/dejs/workflows/test/badge.svg?branch=master)](https://github.com/syumai/dejs/actions)

- [ejs](https://ejs.co) template engine for [deno](https://github.com/denoland/deno).

## Features

### Supported

- <%= %> Output escaped value
- <%- %> Output raw value
- <%# %> Comment (nothing will be shown)
- <% %> Evaluate (use control flow like: if, for)
- include partial ejs template

### Not supported

- All other features of ejs

## Usage

```ts
import * as dejs from 'https://deno.land/x/dejs@0.6.0/mod.ts';
```

- **`renderFile`**`(filePath: string, params: Params): Promise<Deno.Reader>`
  - renders from file, outputs Deno.Reader
- **`render`**`(body: string, params: Params): Promise<Deno.Reader>`
  - renders from string, outputs Deno.Reader
- **`renderFileToString`**`(filePath: string, params: Params): Promise<string>`
  - renders from file, outputs string
- **`renderToString`**`(body: string, params: Params): Promise<string>`
  - renders from string, outputs string
- **`compile`**`(reader: Reader): Promise<Template>`
  - only compiles ejs and returns `Template(params: Params): string`
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
const { cwd, stdout, copy } = Deno;
import { renderFile } from 'https://deno.land/x/dejs/mod.ts';

(async () => {
  const output = await renderFile(`${cwd()}/template.ejs`, {
    name: 'world',
  });
  await copy(output, stdout);
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
const { cwd, stdout, copy } = Deno;
import { render } from 'https://deno.land/x/dejs/mod.ts';

const template = `<body>
  <% if (name) { %>
    <h1>hello, <%= name %>!</h1>
  <% } %>
</body>`;

(async () => {
  const output = await render(template, {
    name: 'world',
  });
  await copy(output, stdout);
})();
```

### Include partial ejs template

- To include template from other file, use `include` function in ejs.
- `include` resolves views from relative path from **executed ts / js file**. (not from ejs template file).
  - This behavior may change in the future.

#### Usage

```ejs
await include(filePath, params)
```

#### Example

- views/header.ejs

```ejs
<html>
<head>
  <title><%- title %></title>
</head>
<body>
```

- views/footer.ejs

```ejs
</body>
</html>
```

- views/main.ejs

```
<%- await include('views/header.ejs', { title: 'include example' }) %>
<h1>hello, world!</h1>
<%- await include('views/footer.ejs') %>
```

- index.ts

```ts
const { cwd, stdout, copy } = Deno;
import { renderFile } from 'https://deno.land/x/dejs/mod.ts';

(async () => {
  const output = await renderFile(`${cwd()}/views/main.ejs`);
  await copy(output, stdout);
})();
```

- console

```sh
$ deno index.ts
<html>
<head>
  <title>include example</title>
</head>
<body>
<h1>hello, world!</h1>
</body>
</html>
```

## Limitations

- backslashes at line end will removed.

## Development

### Update modules

- Please use [dem](https://github.com/syumai/dem)

```
dem update https://deno.land/std@v0.xx.x
```

### Lint

- `make lint`

### Format

- `make fmt`

### Testing

- `make test`

## Author

syumai

## License

MIT
