const { cwd, stdout, copy } = Deno;
import { renderFile } from "../mod.ts";

(async () => {
  const output = await renderFile(`${cwd()}/basic.ejs`, {
    name: "world",
  });
  await copy(output, stdout);
})();
