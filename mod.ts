const { open } = Deno;
type Reader = Deno.Reader;
import { BufReader } from "./vendor/https/deno.land/std/io/bufio.ts";
import { Buffer } from "./vendor/https/deno.land/std/io/buffer.ts";
import { readAll } from "./vendor/https/deno.land/std/io/util.ts";
import escape from "./vendor/https/deno.land/x/lodash/escape.js";

export interface Params {
  //deno-lint-ignore no-explicit-any
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
  (params: Params): Promise<string>;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

class StringReader extends Buffer {
  constructor(s: string) {
    super(encoder.encode(s).buffer);
  }
}

async function include(path: string, params: Params): Promise<string> {
  const result = await renderFile(path, params);
  const buf = new Buffer();
  await buf.readFrom(result);
  return await bufToStr(buf);
}

function sanitize(str: string): string {
  return str
    .replace(/\`/g, "\\\`")
    .replace(/\$/g, "\\\$")
    .replace(/\\+$/, ""); // Trim backslashes at line end. TODO: Fix this to render backslashes.
}

async function bufToStr(buf: Buffer): Promise<string> {
  return decoder.decode(await readAll(buf));
}

function removeLastSemi(s: string): string {
  return s.trimRight().replace(/;$/, "");
}

async function bufToStrWithSanitize(buf: Buffer): Promise<string> {
  return sanitize(await bufToStr(buf));
}

function NewTemplate(script: string): Template {
  return async (params: Params): Promise<string> => {
    const output: Array<string> = [];
    await new Promise((resolve, reject) => {
      const args = {
        ...params,
        include,
        $$OUTPUT: output,
        $$FINISHED: resolve,
        $$ERROR: reject,
        $$ESCAPE: escape,
      };
      const src = `(async() => {
        try { ${script} } catch (error) { $$ERROR(error) }
        $$FINISHED();
      })();`;
      const f = new Function(...Object.keys(args), src);
      f(...Object.values(args));
    });
    return output.join("");
  };
}

export async function compile(reader: Reader): Promise<Template> {
  const src = new BufReader(reader);
  const buf: Array<number> = [];
  const statements: Array<string> = [];
  const statementBuf = new Buffer();
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
        statements.push(
          `;$$OUTPUT.push(\`${await bufToStrWithSanitize(statementBuf)}\`);`,
        );
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
            statements.push(
              `;$$OUTPUT.push(${
                removeLastSemi(await bufToStr(statementBuf))
              });`,
            );
            break;
          case ReadMode.Escaped:
            statements.push(
              `;$$OUTPUT.push($$ESCAPE(${
                removeLastSemi(await bufToStr(statementBuf))
              }));`,
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
  statements.push(
    `$$OUTPUT.push(\`${await bufToStrWithSanitize(statementBuf)}\`);`,
  );
  statementBuf.reset();

  return await NewTemplate(statements.join(""));
}

export async function renderToString(
  body: string,
  params: Params,
): Promise<string> {
  const reader = new StringReader(body);
  const template = await compile(reader);
  return template(params);
}

export async function renderFileToString(
  path: string,
  params: Params,
): Promise<string> {
  const file = await open(path);
  const template = await compile(file);
  file.close();
  return template(params);
}

export async function render(body: string, params: Params): Promise<Reader> {
  const result = await renderToString(body, params);
  return new StringReader(result);
}

export async function renderFile(
  path: string,
  params: Params,
): Promise<Reader> {
  const result = await renderFileToString(path, params);
  return new StringReader(result);
}
