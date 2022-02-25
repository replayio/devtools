import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Accordion</title>
        <meta name="description" content="Replay:: Accordion" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-full flex-col bg-gray-900 font-sans antialiased">
        <header className="firefox:bg-opacity-90 sticky top-0 z-30 h-[72px] bg-gray-900 opacity-50 backdrop-blur  backdrop-filter">
          <div className="max-w-8xl mx-auto xl:px-8">
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-5 sm:px-6 lg:px-8 xl:px-0">
              <a className="block" href="/react">
                <svg
                  viewBox="0 0 184 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8"
                >
                  <g clip-path="url(#logo-___clip0)">
                    <path
                      d="M49.779 10.41c-1.985 0-3.561.73-4.524 2.248V4.95h-3.152v20.437h3.152v-7.824c0-2.978 1.634-4.204 3.706-4.204 1.985 0 3.27 1.167 3.27 3.386v8.642h3.151v-8.963c0-3.795-2.334-6.014-5.603-6.014zM60.528 19.431h11.616c.058-.409.117-.876.117-1.314 0-4.204-2.977-7.707-7.326-7.707-4.582 0-7.705 3.357-7.705 7.678 0 4.38 3.123 7.678 7.938 7.678 2.86 0 5.05-1.197 6.392-3.182l-2.597-1.518c-.7 1.022-2.014 1.81-3.765 1.81-2.335 0-4.174-1.168-4.67-3.445zm-.03-2.57c.438-2.189 2.044-3.59 4.408-3.59 1.897 0 3.735 1.08 4.173 3.59H60.5zM85.777 10.79v2.072c-1.11-1.518-2.831-2.452-5.108-2.452-3.97 0-7.267 3.328-7.267 7.678 0 4.32 3.298 7.678 7.267 7.678 2.277 0 3.999-.934 5.108-2.481v2.102h3.152V10.789h-3.152zm-4.612 11.97c-2.626 0-4.611-1.957-4.611-4.672s1.985-4.671 4.611-4.671c2.627 0 4.612 1.956 4.612 4.671 0 2.715-1.985 4.671-4.612 4.671zM103.431 4.95v7.912c-1.109-1.518-2.831-2.452-5.108-2.452-3.969 0-7.267 3.328-7.267 7.678 0 4.32 3.298 7.678 7.267 7.678 2.277 0 3.999-.934 5.108-2.481v2.102h3.152V4.95h-3.152zM98.82 22.76c-2.627 0-4.612-1.957-4.612-4.672s1.985-4.671 4.612-4.671c2.626 0 4.611 1.956 4.611 4.671 0 2.715-1.985 4.671-4.611 4.671zM109.527 25.387h3.153V4.075h-3.153v21.312zM118.091 19.431h11.616c.058-.409.117-.876.117-1.314 0-4.204-2.977-7.707-7.326-7.707-4.582 0-7.705 3.357-7.705 7.678 0 4.38 3.123 7.678 7.938 7.678 2.86 0 5.049-1.197 6.392-3.182l-2.598-1.518c-.7 1.022-2.013 1.81-3.765 1.81-2.334 0-4.173-1.168-4.669-3.445zm-.03-2.57c.438-2.189 2.044-3.59 4.408-3.59 1.897 0 3.735 1.08 4.173 3.59h-8.581zM134.128 14.818c0-1.05.993-1.547 2.131-1.547 1.197 0 2.218.525 2.744 1.664l2.656-1.489c-1.022-1.927-3.007-3.036-5.4-3.036-2.977 0-5.341 1.722-5.341 4.467 0 5.225 7.851 3.766 7.851 6.364 0 1.168-1.08 1.635-2.481 1.635-1.605 0-2.772-.788-3.239-2.102l-2.715 1.576c.934 2.102 3.036 3.416 5.954 3.416 3.152 0 5.692-1.576 5.692-4.496 0-5.4-7.852-3.795-7.852-6.452zM145.968 14.818c0-1.05.993-1.547 2.131-1.547 1.196 0 2.218.525 2.743 1.664l2.656-1.489c-1.021-1.927-3.006-3.036-5.399-3.036-2.977 0-5.341 1.722-5.341 4.467 0 5.225 7.851 3.766 7.851 6.364 0 1.168-1.08 1.635-2.481 1.635-1.605 0-2.773-.788-3.24-2.102l-2.714 1.576c.934 2.102 3.035 3.416 5.954 3.416 3.152 0 5.691-1.576 5.691-4.496 0-5.4-7.851-3.795-7.851-6.452zM170.01 22.02c2.187 0 3.806-1.308 3.806-3.453v-6.69h-1.96v6.534c0 .966-.511 1.69-1.846 1.69s-1.847-.724-1.847-1.69v-6.535h-1.945v6.691c0 2.145 1.619 3.452 3.792 3.452zM175.865 11.876v9.944h1.96v-9.944h-1.96z"
                      fill="#fff"
                    ></path>
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M177.046 7.107h-10.144a4.059 4.059 0 00-4.058 4.058v10.148a4.059 4.059 0 004.058 4.058h10.144a4.059 4.059 0 004.058-4.058V11.166a4.059 4.059 0 00-4.058-4.06zm-10.144-2.03a6.087 6.087 0 00-6.086 6.088v10.148a6.087 6.087 0 006.086 6.088h10.144a6.087 6.087 0 006.087-6.088V11.166a6.087 6.087 0 00-6.087-6.089h-10.144z"
                      fill="#fff"
                    ></path>
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M166.902 7.107h10.144a4.059 4.059 0 014.058 4.058v10.148a4.059 4.059 0 01-4.058 4.058h-10.144a4.059 4.059 0 01-4.058-4.058V11.166a4.059 4.059 0 014.058-4.06zm-6.086 4.058a6.087 6.087 0 016.086-6.088h10.144a6.087 6.087 0 016.087 6.088v10.148a6.087 6.087 0 01-6.087 6.088h-10.144a6.087 6.087 0 01-6.086-6.088V11.166z"
                      fill="#fff"
                    ></path>
                    <path
                      d="M6.495 19.883l19.52-6.518c-.39-2.44-.668-4.07-.99-5.314-.347-1.338-.622-1.696-.73-1.82a3.807 3.807 0 00-1.371-.996c-.152-.065-.578-.216-1.956-.133-1.458.088-3.372.386-6.403.866-3.03.48-4.943.789-6.356 1.155-1.337.347-1.696.623-1.82.731-.43.377-.77.845-.995 1.371-.065.152-.216.578-.133 1.957.088 1.458.386 3.373.866 6.404.134.85.255 1.61.368 2.297z"
                      fill="url(#logo-___paint0_linear)"
                    ></path>
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M1.113 18.38C.185 12.516-.28 9.584.726 7.23a8.885 8.885 0 012.324-3.2C4.977 2.347 7.908 1.883 13.77.954 19.634.024 22.565-.44 24.92.566a8.882 8.882 0 013.198 2.324c1.684 1.928 2.148 4.86 3.076 10.725.929 5.864 1.393 8.797.387 11.15a8.883 8.883 0 01-2.323 3.2c-1.927 1.684-4.859 2.148-10.722 3.077-5.862.929-8.794 1.393-11.147.387a8.883 8.883 0 01-3.198-2.324c-1.684-1.928-2.148-4.86-3.077-10.725zm10.341 10.414c1.57-.095 3.592-.412 6.585-.886 2.994-.474 5.013-.798 6.537-1.193 1.475-.383 2.155-.756 2.594-1.14a5.711 5.711 0 001.493-2.057c.23-.536.375-1.298.283-2.82-.095-1.57-.412-3.593-.886-6.587-.474-2.994-.797-5.015-1.192-6.538-.383-1.476-.757-2.156-1.14-2.595a5.71 5.71 0 00-2.056-1.494c-.536-.23-1.298-.375-2.82-.283-1.57.095-3.591.412-6.585.886-2.993.475-5.013.798-6.536 1.193-1.476.383-2.155.757-2.594 1.14a5.712 5.712 0 00-1.494 2.057c-.229.536-.374 1.298-.282 2.82.095 1.571.411 3.593.886 6.587.474 2.994.797 5.015 1.192 6.538.383 1.476.756 2.156 1.14 2.595a5.711 5.711 0 002.056 1.494c.536.23 1.297.375 2.82.283z"
                      fill="url(#logo-___paint1_linear)"
                    ></path>
                  </g>
                  <defs>
                    <linearGradient
                      id="logo-___paint0_linear"
                      x1="12.69"
                      y1="0"
                      x2="17.769"
                      y2="31.733"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stop-color="#66E3FF"></stop>
                      <stop offset="1" stop-color="#7064F9"></stop>
                    </linearGradient>
                    <linearGradient
                      id="logo-___paint1_linear"
                      x1="12.69"
                      y1="0"
                      x2="17.769"
                      y2="31.733"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stop-color="#66E3FF"></stop>
                      <stop offset="1" stop-color="#7064F9"></stop>
                    </linearGradient>
                    <clipPath id="logo-___clip0">
                      <path fill="#fff" d="M0 0h184v32H0z"></path>
                    </clipPath>
                  </defs>
                </svg>
              </a>
              <a
                className="text-gray-400 hover:text-white"
                href="https://github.com/tailwindlabs/headlessui"
              >
                <span className="sr-only">GitHub repository</span>
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
              </a>
            </div>
          </div>
        </header>
        <div className="bg-gray-900">
          <div className="max-w-8xl mx-auto flex px-4 sm:px-6 lg:px-8">
            <main className="flex min-w-0 flex-1 pt-12">
              <div className="order-1 mx-auto min-w-0 max-w-[800px] flex-1">
                <div className="prose">
                  <h1>Accordion</h1>
                </div>
                <div className="prose mb-9.5 mt-4">
                  <p className="text-lg">
                    Replay's Accordion is modeled after other application split views such as VS
                    Code and Figma. The goal is to provide a flex-like layout for a collection of
                    sub panels.
                  </p>
                </div>

                <div className="my-8 h-72 w-full rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 ">
                  2
                </div>
                <div className="prose">
                  <h2>Installation</h2>
                </div>
                <div className="prose mb-9.5 mt-4">
                  <p className="text-lg">To get started, install Headless UI via npm or yarn:</p>
                </div>

                <div className="prose mt-12">
                  <h2>Basic example</h2>
                </div>
                <div className="prose mb-9.5 mt-4">
                  <p className="text-lg">
                    Listboxes are built using the Listbox, Listbox.Button, Listbox.Options,
                    Listbox.Option and Listbox.Label components. The Listbox.Button will
                    automatically open/close the Listbox.Options when clicked, and when the menu is
                    open, the list of items receives focus and is automatically navigable via the
                    keyboard.
                  </p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

`

## Accordion
Replay's Accordion is modeled after other application 
split views such as VS Code and Figma. 
The goal is to provide a flex-like layout for a collection of sub panels.




`;
