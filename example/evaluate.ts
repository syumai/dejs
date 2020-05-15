const { cwd, stdout, copy } = Deno;
import { renderFile } from "../mod.ts";

(async () => {
  const output = await renderFile(`${cwd()}/evaluate.ejs`, {});
  await copy(output, stdout);
})();
