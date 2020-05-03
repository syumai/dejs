SHELL=/bin/bash
TARGET_SRC=$(shell shopt -s globstar && ls ./*.ts | grep -v ./vendor)

lint:
	deno fmt --check $(TARGET_SRC)

fmt:
	deno fmt $(TARGET_SRC)

test:
	deno test -c ./testdata/tsconfig.json --allow-read mod_test.ts

.PHONY: lint fmt test