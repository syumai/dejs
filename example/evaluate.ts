import { cwd, stdout, copy } from 'deno';
import { render } from '../dpl.ts';

(async () => {
  const output = await render(`${cwd()}/basic.ejs`, {
    name: 'world',
  });
  await copy(stdout, output);
})();
