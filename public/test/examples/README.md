# Replay E2E Examples

All of the build artifacts used by our E2E tests are committed to this folder, and will be served up by our Next dev server at `localhost:8080` when we create new "golden recordings".

The majority of the examples are plain HTML files with embedded JS. For other examples, such as `cra`, `redux`, and some Webpack bundles, the actual source code lives in `packages/e2e-tests/examples` - see instructions there for rebuilding and recreating the build artifacts if necessary.