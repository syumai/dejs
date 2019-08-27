.PHONY: test

test:
	deno -c ./testdata/tsconfig.json --allow-read mod_test.ts
