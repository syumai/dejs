const { cwd, stdout, copy } = Deno;
import { renderFile } from "../mod.ts";

(async () => {
  const output = await renderFile(`${cwd()}/include/main.ejs`, {});
  await copy(output, stdout);
})();
