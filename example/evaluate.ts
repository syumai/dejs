const { cwd, stdout, copy } = Deno;
import { renderFile } from '../dejs.ts';

(async () => {
  const output = await renderFile(`${cwd()}/evaluate.ejs`, {});
  await copy(stdout, output);
})();
