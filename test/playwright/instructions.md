# Running Playwright tests with replay

Playwright scripts can run using replay-enabled versions of firefox on macOS and linux. These instructions describe how to run and record the attached basic.js test. These setup instructions are macOS-specific and experimental and will be refined over time.

1. Create a temporary directory $PLAYWRIGHTDIR somewhere, e.g. `~/playwright-tmp`

2. Copy `basic.js` to $PLAYWRIGHTDIR

3. Install playwright:

```
cd $PLAYWRIGHTDIR
npm i playwright
```

4. Run `node basic.js` to run playwright with the regular version of firefox. Check the test works.

5. Install the replay version of playwright:

```
mkdir browsers
mkdir browsers/firefox-1225 # This might need changing if errors happen later when running.
cd browsers/firefox-1225
wget https://replay.io/downloads/macOS-replay-playwright.dmg
wget https://replay.io/downloads/macOS-recordreplay.so
7z x macOS-replay-playwright.dmg # If 7z doesn't exist, try `brew install p7zip` first.
mv Nightly firefox
chmod +x firefox/Nightly.app/Contents/MacOS/firefox
chmod +x firefox/Nightly.app/Contents/MacOS/plugin-container.app/Contents/MacOS/plugin-container
cd $PLAYWRIGHTDIR
```

5. Run `PLAYWRIGHT_BROWSERS_PATH=$PLAYWRIGHTDIR/browsers node basic.js` to run playwright with the replay-enabled version of firefox, but without recording. Check the test works.

6. Run `PLAYWRIGHT_BROWSERS_PATH=$PLAYWRIGHTDIR/browsers RECORD_ALL_CONTENT=1 RECORD_REPLAY_DRIVER=$PLAYWRIGHTDIR/browsers/firefox-1225/macOS-recordreplay.so RECORD_REPLAY_RECORDING_ID_FILE=$PLAYWRIGHTDIR/recordings.log RECORD_REPLAY_SERVER=wss://dispatch.replay.io node basic.js` to run playwright and record the browser. Check the test works. After the test finishes the node process will continue running until the recording upload finishes.

7. There should be a `$PLAYWRIGHTDIR/recordings.log` file with a single recording UUID in it. Load this up in a browser as `https://replay.io/view?id=$RECORDINGID` to view the recording of the playwright test.

Note: The test is configured to launch firefox in headful (not headless) mode, to make it easier to see what the test is doing. Things should work when launching in headless mode as well.
