# Icon

The `Icon` component manages all of the icons used throughout Replay. The icons are built using a [Node script](../scripts/icons.js) that sources the design system icons located in Figma [here](https://www.figma.com/file/ASas6u2DMihEEzw8jPT1XC/Replay-Component-Library?node-id=134%3A2898).

## Adding a new icon

First, visit the [icons page](https://www.figma.com/file/ASas6u2DMihEEzw8jPT1XC/Replay-Component-Library?node-id=134%3A2898) in Figma and add a new icon. Note, that the layer name is used to access the icon in code and should use kebab casing (e.g. "comment-plus" instead of "Comment Plus").

Next, make sure you have a `.env` file at the root of this project that contains a <a href="https://www.figma.com/developers/docs#auth-dev-token">personal access token</a>.

```env
FIGMA_TOKEN=personal-token-here
```

From the root of the project, use the build script to download and generate the icons:

```bash
yarn workspace design icons
```

This will generate two files:

- A `types.d.ts` file located in the [Icon](../Icon/) package which provides types for all of the icons.
- And a `sprite.svg` file located in the [public](../../../public/icons/) NextJS directory.

Now to access the generated icons, use the `Icon` component:

```tsx
import { Icon } from "design";

export function BasicUsage() {
  return <Icon name="checked" />;
}
```

## Troubleshooting

Sometimes the build can fail for multiple reasons. Check the following and try running the script again:

- Check the root `.env` file is correct and you have a valid token.
- All icons to be exported must be components and should be located in the `Icons` page.
- Check the icon page includes the word `Icons` and has not changed.
- Check Figma's [status page](http://status.figma.com/) to make sure the API is up and running.

### Figma API Down

If for some reason the Figma API is down, you can run the build script without the `--fetch` option which will only process the svgs directoy:

```bash
node scripts/icons.js
```

If the problem still persists, please open an issue explaining the error you're experiencing.
