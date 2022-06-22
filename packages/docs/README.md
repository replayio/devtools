# Docs Site

This is the docs site for Replay packages. It uses a NextJS site with Esbuild and TS Morph to compile isolated source code for a quick prototyping environment.

## Development

To get started, clone the repo and run the following:

```bash
yarn dev
```

This will start two servers. One is the NextJS development server and the other is a data gathering Node script that uses Esbuild and TS Morph to compile examples and collect type information.
