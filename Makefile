.PHONY: test

test:
	deno -c ./testdata/tsconfig.json --allow-read dejs_test.ts
