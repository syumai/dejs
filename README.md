# dpl

- [**d**eno](https://github.com/denoland/deno) tem**pl**ate engine.
- dpl can render [ejs](https://ejs.co) with _simple rules_.

## Features

### Supported

- <%= %> Escaped
- <%- %> Raw
- <%# %> Comment
- <% %> Evaluate (Basic support)

### Not supported

- All other features of ejs

## Usage

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

## Author

syumai

## License

MIT
