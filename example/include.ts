import { cwd, stdout, copy } from 'deno';
import { renderFile } from '../dejs.ts';

(async () => {
  const output = await renderFile(`${cwd()}/include/main.ejs`, {});
  await copy(stdout, output);
})();
