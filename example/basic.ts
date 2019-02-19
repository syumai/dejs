const { cwd, stdout, copy } = Deno;
import { renderFile } from '../dejs.ts';

(async () => {
  const output = await renderFile(`${cwd()}/basic.ejs`, {
    name: 'world',
  });
  await copy(stdout, output);
})();
