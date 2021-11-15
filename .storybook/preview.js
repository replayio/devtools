import "base.css";
import "image/image.css";
import "devtools/client/debugger/src/components/shared/AccessibleImage.css";
import "devtools/client/themes/variables.css";
import "tailwindcss/tailwind.css";
import { withRootAttribute } from "storybook-addon-root-attribute";

export const decorators = [withRootAttribute];

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  rootAttribute: {
    defaultState: {
      name: "Default",
      value: "theme-light",
    },
    states: [
      {
        name: "Dark",
        value: "theme-dark",
      },
    ],
  },
};
