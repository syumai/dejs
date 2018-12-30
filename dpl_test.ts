import { Buffer, copy, cwd, stdout, open } from 'deno';
import { test, assertEqual } from 'https://deno.land/x/testing/testing.ts';
import * as dpl from './dpl.ts';
import escape from './escape.ts';

// renderStringTest
(() => {
  interface testCase {
    name: string;
    body: string;
    param?: string;
    expected: string;
  }

  const testCases: Array<testCase> = [
    {
      name: 'Normal',
      body: 'normal test',
      expected: 'normal test',
    },
    {
      name: 'Escaped',
      body: '<%= param %>',
      param: '<div>test</div>',
      expected: escape('<div>test</div>'),
    },
    {
      name: 'Raw',
      body: '<%- param %>',
      param: '<div>test</div>',
      expected: '<div>test</div>',
    },
    {
      name: 'Comment',
      body: '<%# param %>',
      param: '<div>test</div>',
      expected: '',
    },
    {
      name: 'Escaped without spacing',
      body: '<%=param%>',
      param: '<div>test</div>',
      expected: escape('<div>test</div>'),
    },
    {
      name: 'Raw without spacing',
      body: '<%-param%>',
      param: '<div>test</div>',
      expected: '<div>test</div>',
    },
    {
      name: 'Comment without spacing',
      body: '<%#param%>',
      param: '<div>test</div>',
      expected: '',
    },
  ];

  for (const tc of testCases) {
    test({
      name: tc.name,
      fn: async () => {
        const buf = new Buffer();
        await copy(buf, await dpl.renderString(tc.body, { param: tc.param }));
        const actual = buf.toString();
        assertEqual(actual, tc.expected);
      },
    });
  }
})();

// renderTest
(() => {
  interface testCase {
    name: string;
    fileName: string;
    param?: string;
    expected: string;
  }

  const testCases: Array<testCase> = [
    {
      name: 'Normal',
      fileName: 'normal',
      expected: 'normal test',
    },
    {
      name: 'Raw',
      fileName: 'raw',
      param: '<div>test</div>',
      expected: '<div>test</div>',
    },
  ];

  for (const tc of testCases) {
    test({
      name: tc.name,
      fn: async () => {
        let buf = new Buffer();
        await copy(
          buf,
          await dpl.render(`${cwd()}/testdata/${tc.fileName}.ejs`, {
            param: tc.param,
          })
        );
        const actual = buf.toString();
        assertEqual(actual, tc.expected);
      },
    });
  }
})();
