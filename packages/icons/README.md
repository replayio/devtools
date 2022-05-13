# Icons

This package contains the icons used in the application. The icons are built using our design system icons located [here](https://www.figma.com/file/ASas6u2DMihEEzw8jPT1XC/Replay-Component-Library?node-id=134%3A2898).

## Development

Make sure you have a `.env` file at the root of the project that contains a <a href="https://www.figma.com/developers/docs#auth-dev-token">personal access token</a>.

```env
FIGMA_TOKEN=personal-token-here
```

Once that is setup, you can run the following script to download and generate the icons:

```bash
npm run build
```

This will generate an `index.js` file that can be committed to the project.
