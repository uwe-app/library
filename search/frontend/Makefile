DEST=../../../plugins/system/search

WASM_SOURCE=../backend
WASM_PKG=$(WASM_SOURCE)/pkg
WASM_FILE=$(WASM_PKG)/search_bg.wasm
WASM_DEST=$(DEST)/search.wasm

LIB_SOURCE=./
LIB_DIST=$(LIB_SOURCE)/dist
LIB_JS=$(LIB_DIST)/search.js
LIB_CSS=$(LIB_DIST)/search.css

all: wasm library

wasm:
	@(cd $(WASM_SOURCE) && make wasm-prod)
	@cp -f $(WASM_FILE) $(WASM_DEST)

binding: wasm
	@rm -rf node_modules/binding
	@cp -rf $(WASM_PKG) node_modules/binding

library: binding
	@(yarn prod)
	@cp -f $(LIB_JS) $(LIB_CSS) $(DEST)

.PHONY: all wasm library
