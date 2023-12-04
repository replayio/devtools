import React from "react";

import styles from "./TestRunsNUX.module.css";

function DocsLinks() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Installation docs</h1>
      <p>
        <ul className={styles.content}>
          <li>
            <a href="https://docs.replay.io/test-suites/cypress/cypress-installation">Cypress</a>
          </li>
          <li>
            <a href="https://docs.replay.io/test-suites/playwright/playwright-installation">
              Playwright
            </a>
          </li>

          <li>
            <a href="https://docs.replay.io/test-suites/puppeteer">Puppeteer</a>
          </li>

          <li>
            <a href="https://docs.replay.io/test-suites/jest">Jest</a>
          </li>

          <li>
            <a href="https://docs.replay.io/test-suites/webdriver-io">Webdriver-io</a>
          </li>
        </ul>
      </p>
    </div>
  );
}

export function TestRunsNUX() {
  return (
    <div className={styles["container"]}>
      <div className={styles["form-container"]}>
        <div className={styles["instructions"]}>
          <h1>Let's get you rolling</h1>
          <p>
            Your replay team is ready to go. Follow these steps below to get things in tip-top
            shape.
          </p>
        </div>
        <h1>Team name</h1>
        <input type="text" placeholder="Testsuites dashboard" className={styles["input-style"]} />

        <label htmlFor="test-runner" className={styles["section-header"]}>
          Test runner
        </label>
        <select className={styles["select-style"]} id="test-runner">
          <option value="cypress">Cypress</option>
          <option value="jest">Jest</option>
          <option value="mocha">Mocha</option>
        </select>

        <label htmlFor="package-manager" className={styles["section-header"]}>
          Package manager
        </label>
        <select className={styles["select-style"]} id="package-manager">
          <option value="npm">npm</option>
          <option value="yarn">Yarn</option>
          <option value="pnpm">pnpm</option>
        </select>

        <hr />

        <div className={styles["instructions-list"]}>
          <p className={styles["step-number"]}>1. Install the Replay plugin</p>
          <p>Install the @replayio/cypress package in your project</p>
          <input
            type="text"
            placeholder="npm install @replayio/cypress -D"
            className={styles["input-style"]}
          />

          <p className={styles["step-number"]}>2. Add the Replay plugin to cypress.config.js</p>
          <textarea
            placeholder="const { defineConfig } = require('cypress');\n// Add this line to require the replay plugin\nconst { plugin: replayPlugin } = require('@replayio/cypress')\n\nmodule.exports = defineConfig({\ne2e: {\n  setupNodeEvents(on, config) {\n    // Add this line to install the replay plugin\n    replayPlugin(on, config, {\n      upload: true,\n      apiKey: process.env.REPLAY_API_KEY,\n    });\n    // Make sure that setupNodeEvents returns config\n  }\n});"
            className={styles["textarea-style"]}
          ></textarea>

          <p className={styles["step-number"]}>3. Run the tests with Replay enabled</p>
          <input
            type="text"
            placeholder="npx cypress run --env replay=true"
            className={styles["input-style"]}
          />

          <p className={styles["step-number"]}>4. View your test results on the Replay dashboard</p>
          <input
            type="text"
            placeholder="Check your Replay dashboard for test results"
            className={styles["input-style"]}
          />

          <p className={styles["step-number"]}>5. Share test results with your team</p>
          <input
            type="text"
            placeholder="Share the Replay dashboard URL with your team"
            className={styles["input-style"]}
          />
        </div>
      </div>
      <div className={styles["backgroundImage"]}>HELLO HELLO HELLO</div>
    </div>
  );
}

export default TestRunsNUX;
