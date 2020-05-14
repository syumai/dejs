const { open } = Deno;
type Reader = Deno.Reader;
import { stringsReader } from "./vendor/https/deno.land/std/io/util.ts";
import { BufReader } from "./vendor/https/deno.land/std/io/bufio.ts";
import escape from "./vendor/https/deno.land/x/lodash/escape.js";

export interface Params {
  [key: string]: any;
}

enum ReadMode {
  Normal,
  Escaped,
  Raw,
  Comment,
  Evaluate,
}

enum Codes {
  Begin = 60, // <
  End = 62, // >
  Percent = 37, // %
  Escaped = 61, // =
  Raw = 45, // -
  Comment = 35, // #
}

interface Template {
  (params: Params): Promise<Reader>;
}

const decoder = new TextDecoder("utf-8");

async function include(path: string, params: Params): Promise<string> {
  const result = await renderFile(path, params);
  const buf = new Deno.Buffer();
  await buf.readFrom(result);
  return await bufToStr(buf);
}

async function bufToStr(buf: Deno.Buffer): Promise<string> {
  return decoder.decode(await Deno.readAll(buf));
}

function NewTemplate(script: string): Template {
  return async (params: Params): Promise<Reader> => {
    const output: Array<string> = [];
    await new Promise((resolve) => {
      const args = {
        ...params,
        include,
        $$OUTPUT: output,
        $$FINISHED: resolve,
        $$ESCAPE: escape,
      };
      const src = `(async() => {
        ${script}
        $$FINISHED();
      })();`;
      const f = new Function(...Object.keys(args), src);
      f(...Object.values(args));
    });
    return stringsReader(output.join(""));
  };
}

export async function compile(reader: Reader): Promise<Template> {
  const src = new BufReader(reader);
  const buf: Array<number> = [];
  const statements: Array<string> = [];
  const statementBuf = new Deno.Buffer();
  let readMode: ReadMode = ReadMode.Normal;
  const statementBufWrite = async (byte: number): Promise<number> =>
    await statementBuf.write(new Uint8Array([byte]));

  while (true) {
    const byte = await src.readByte();
    if (byte === null) {
      break;
    }

    buf.push(byte);
    if (buf.length < 3) {
      continue;
    }

    if (readMode === ReadMode.Normal) {
      // Detect ReadMode
      if (buf[0] === Codes.Begin && buf[1] === Codes.Percent) {
        switch (buf[2]) {
          case Codes.Escaped:
            readMode = ReadMode.Escaped;
            break;
          case Codes.Raw:
            readMode = ReadMode.Raw;
            break;
          case Codes.Comment:
            readMode = ReadMode.Comment;
            break;
          default:
            readMode = ReadMode.Evaluate;
            break;
        }
        statements.push(`$$OUTPUT.push(\`${await bufToStr(statementBuf)}\`);`);
        statementBuf.reset();
        buf.splice(0);
        continue;
      }
      if (buf.length > 2) {
        await statementBufWrite(buf.shift() as number);
      }
      continue;
    }

    // Finish current ReadMode
    if (buf[1] === Codes.Percent && buf[2] === Codes.End) {
      statementBufWrite(buf.shift() as number);
      buf.splice(0);
      // Don't execute if ReadMode is Comment.
      if (readMode !== ReadMode.Comment) {
        switch (readMode) {
          case ReadMode.Raw:
            statements.push(`$$OUTPUT.push(${await bufToStr(statementBuf)});`);
            break;
          case ReadMode.Escaped:
            statements.push(
              `$$OUTPUT.push($$ESCAPE(${await bufToStr(statementBuf)}));`,
            );
            break;
          case ReadMode.Evaluate:
            statements.push(await bufToStr(statementBuf));
            break;
        }
      }
      statementBuf.reset();
      readMode = ReadMode.Normal;
      continue;
    }
    await statementBufWrite(buf.shift() as number);
  }

  // Flush buffer
  while (buf.length > 0) {
    await statementBufWrite(buf.shift() as number);
  }
  statements.push(`$$OUTPUT.push(\`${await bufToStr(statementBuf)}\`);`);
  statementBuf.reset();

  return await NewTemplate(statements.join(""));
}

export async function render(body: string, params: Params): Promise<Reader> {
  const reader = stringsReader(body);
  const template = await compile(reader);
  return template(params);
}

export async function renderFile(
  path: string,
  params: Params,
): Promise<Reader> {
  const file = await open(path);
  const template = await compile(file);
  file.close();
  return template(params);
}
