import { cwd, stdout, copy } from 'deno';
import { render } from '../dpl.ts';

(async () => {
  const output = await render(`${cwd()}/evaluate.ejs`, {});
  await copy(stdout, output);
})();
