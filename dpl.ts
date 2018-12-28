import { Reader, ReadResult, open, copy } from 'deno';
import { stringsReader } from 'https://deno.land/x/net/util.ts';
import escape from './escape.ts';
import { MultiReader } from 'https://syumai.github.io/deno-libs/io/multi.ts';

const globalEval = eval;
const window = globalEval('this');

export interface Params {
  [key: string]: any;
}

enum ReadMode {
  Normal,
  EscapedValue,
  Value,
}

enum Codes {
  Begin = 60, // <
  End = 62, // >
  Percent = 37, // %
  EscapedValue = 61, // =
  Value = 45, // -
}

export async function render(path: string, params: Params): Promise<Reader> {
  const file = await open(path);
  let src: Reader = file;
  let buf = [];
  const statement: Array<number> = [];
  const readBuf = new Uint8Array(1);
  const dec = new TextDecoder('utf-8');
  let readMode: ReadMode = ReadMode.Normal;

  for (const [k, v] of Object.entries(params)) {
    window[k] = v;
  }

  return {
    async read(p: Uint8Array): Promise<ReadResult> {
      const len = p.byteLength;
      let eof: boolean;
      let nread: number;
      for (nread = 0; nread < len; nread++) {
        ({ eof } = await src.read(readBuf));
        if (eof) {
          break;
        }
        buf.push(readBuf[0]);
        if (buf.length < 3) {
          continue;
        }
        switch (readMode) {
          case ReadMode.Normal:
            // Detect ReadMode
            if (buf[0] === Codes.Begin && buf[1] === Codes.Percent) {
              switch (buf[2]) {
                case Codes.EscapedValue:
                  readMode = ReadMode.EscapedValue;
                  break;
                case Codes.Value:
                  readMode = ReadMode.Value;
                  break;
                default:
                  continue;
              }
              buf.splice(0);
              nread -= 3;
              continue;
            }
            if (buf.length > 2) {
              p[nread] = buf.shift();
            }
            break;
          default:
            if (buf[1] === Codes.Percent && buf[2] === Codes.End) {
              statement.push(buf.shift());
              buf.splice(0);
              const body = new Uint8Array(statement);
              const str = dec.decode(body);
              const s = globalEval(str).toString();
              switch (readMode) {
                case ReadMode.Value:
                  src = new MultiReader(stringsReader(s), src);
                  break;
                case ReadMode.EscapedValue:
                  src = new MultiReader(stringsReader(escape(s)), src);
                  break;
              }
              statement.splice(0);
              readMode = ReadMode.Normal;
              nread -= 2;
              continue;
            }
            statement.push(buf.shift());
            break;
        }
      }
      // Flush buffer
      while (nread < len && buf.length > 0) {
        p[nread] = buf.shift();
        nread++;
      }
      return { nread, eof };
    },
  };
}
