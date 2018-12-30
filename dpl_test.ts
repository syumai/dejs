import { Buffer, copy, cwd, stdout, open } from 'deno';
import { test, assertEqual } from 'https://deno.land/x/testing/testing.ts';
import * as dpl from './dpl.ts';
import escape from './escape.ts';

// renderStringTest
(() => {
  interface testCase {
    name: string;
    body: string;
    param?: any;
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
      name: 'Evaluate if true',
      body: '<% if (param) { %>test<% } %>',
      param: true,
      expected: 'test',
    },
    {
      name: 'Evaluate if false',
      body: '<% if (param) { %>test<% } %>',
      param: false,
      expected: '',
    },
    {
      name: 'Evaluate for',
      body: '<% for (let i = 0; i < 3; i++) { %>Test<% } %>',
      expected: 'TestTestTest',
    },
    {
      name: 'Evaluate nested for',
      body:
        '<% for (let i = 0; i < 2; i++) { %><% for (let j = 0; j < 2; j++) { %>Test<% } %><% } %>',
      expected: 'TestTestTestTest',
    },
    {
      name: 'Evaluate if true',
      body: '<% if (param) { %>test<% } %>',
      param: true,
      expected: 'test',
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
    param?: any;
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
