import { Reader, ReadResult, open, copy } from 'deno';
import { stringsReader } from 'https://deno.land/x/net/util.ts';
import escape from './escape.ts';

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

const parenStartCode = 60; // <
const parenEndCode = 62; // >
const percentCode = 37; // %
const equalCode = 61; // =
const minusCode = 45; // -

export async function render(path: string, params: Params): Promise<Reader> {
  let src = await open(path);
  let buf = [];
  let statement: Array<number> = [];
  const readBuf = new Uint8Array(1);
  const dec = new TextDecoder('utf-8');
  let evalResult: Reader;
  let readMode: ReadMode = ReadMode.Normal;

  for (const [k, v] of Object.entries(params)) {
    window[k] = v;
  }

  return {
    async read(p: Uint8Array): Promise<ReadResult> {
      const len = p.byteLength;
      let eof: boolean;
      let nread: number;
      for (nread = 0; nread < len && !eof; nread++) {
        if (evalResult) {
          const { eof } = await evalResult.read(readBuf);
          if (!eof) {
            p[nread] = readBuf[0];
            continue;
          }
        }
        ({ eof } = await src.read(readBuf));
        buf.push(readBuf[0]);
        if (buf.length < 3) {
          continue;
        }
        switch (readMode) {
          case ReadMode.Normal:
            if (buf[0] === parenStartCode && buf[1] === percentCode) {
              switch (buf[2]) {
                case equalCode:
                  readMode = ReadMode.EscapedValue;
                  break;
                case minusCode:
                  readMode = ReadMode.Value;
                  break;
                default:
                  continue;
              }
              buf.shift();
              buf.shift();
              buf.shift();
              nread -= 3;
              continue;
            }
            if (buf.length > 2) {
              p[nread] = buf.shift();
            }
            break;
          default:
            if (buf[1] === percentCode && buf[2] === parenEndCode) {
              statement.push(buf.shift());
              buf.shift();
              buf.shift();
              const body = new Uint8Array(statement);
              const str = dec.decode(body);
              const s = globalEval(str).toString();
              switch (readMode) {
                case ReadMode.Value:
                  evalResult = stringsReader(s);
                  break;
                case ReadMode.EscapedValue:
                  evalResult = stringsReader(escape(s));
                  break;
              }
              statement = [];
              readMode = ReadMode.Normal;
              nread -= 2;
              continue;
            }
            statement.push(buf.shift());
            break;
        }
      }
      // TODO: flush buffer
      return { nread, eof };
    },
  };
}
