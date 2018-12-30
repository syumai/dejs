import { Reader, open, Buffer } from 'deno';
import { stringsReader } from 'https://deno.land/x/net/util.ts';
import escape from './escape.ts';

const globalEval = eval;
const window = globalEval('this');

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

async function renderInternal(body: Reader, params: Params): Promise<Reader> {
  const buf: Array<number> = [];
  const statements: Array<string> = [];
  const statementBuf = new Buffer();
  const readBuf = new Uint8Array(1);
  let readMode: ReadMode = ReadMode.Normal;
  const statementBufWrite = async (byte: number): Promise<number> =>
    await statementBuf.write(new Uint8Array([byte]));

  let eof = false;
  while (!eof) {
    ({ eof } = await body.read(readBuf));
    if (eof) {
      break;
    }

    buf.push(readBuf[0]);
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
        statements.push(`$$OUTPUT.push(\`${statementBuf.toString()}\`);`);
        statementBuf.reset();
        buf.splice(0);
        continue;
      }
      if (buf.length > 2) {
        await statementBufWrite(buf.shift());
      }
      continue;
    }

    // Finish current ReadMode
    if (buf[1] === Codes.Percent && buf[2] === Codes.End) {
      statementBuf.write(new Uint8Array([buf.shift()]));
      buf.splice(0);
      // Don't execute if ReadMode is Comment.
      if (readMode !== ReadMode.Comment) {
        switch (readMode) {
          case ReadMode.Raw:
            statements.push(`$$OUTPUT.push(${statementBuf.toString()});`);
            break;
          case ReadMode.Escaped:
            statements.push(
              `$$OUTPUT.push($$ESCAPE(${statementBuf.toString()}));`
            );
            break;
          case ReadMode.Evaluate:
            statements.push(statementBuf.toString());
            break;
        }
      }
      statementBuf.reset();
      readMode = ReadMode.Normal;
      continue;
    }
    await statementBufWrite(buf.shift());
  }

  // Flush buffer
  while (buf.length > 0) {
    await statementBufWrite(buf.shift());
  }
  statements.push(`$$OUTPUT.push(\`${statementBuf.toString()}\`);`);
  statementBuf.reset();

  for (const [k, v] of Object.entries(params)) {
    window[k] = v;
  }
  window.$$OUTPUT = [];
  window.$$ESCAPE = escape;

  globalEval(statements.join(''));

  return stringsReader(String(window.$$OUTPUT.join('')));
}

export async function renderString(
  str: string,
  params: Params
): Promise<Reader> {
  const body = stringsReader(str);
  return await renderInternal(body, params);
}

export async function render(path: string, params: Params): Promise<Reader> {
  const file = await open(path);
  return await renderInternal(file, params);
}
