# dejs

[![Build Status](https://travis-ci.org/syumai/dejs.svg?branch=master)](https://travis-ci.org/syumai/dejs)

- [ejs](https://ejs.co) template engine for [deno](https://github.com/denoland/deno).

## Features

### Supported

- <%= %> Output escaped value
- <%- %> Output raw value
- <%# %> Comment (nothing will be shown)
- <% %> Evaluate (use control flow like: if, for)
- include other ejs template

### Not supported

- All other features of ejs

## Usage

```ts
import * as dejs from 'https://deno.land/x/dejs@0.1.1/dejs.ts';
```

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
import { renderFile } from 'https://deno.land/x/dejs/dejs.ts';

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
import { render } from 'https://deno.land/x/dejs/dejs.ts';

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

### Include other ejs template

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
import { cwd, stdout, copy } from 'deno';
import { renderFile } from 'https://deno.land/x/dejs/dejs.ts';

(async () => {
  const output = await renderFile(`${cwd()}/views/main.ejs`);
  await copy(stdout, output);
})();
```

- console

```sh
$ deno index.ts
<html>
<head>
  <title><%- title %></title>
</head>
<body>
<h1>hello, world!</h1>
</body>
</html>
```

## Author

syumai

## License

MIT
