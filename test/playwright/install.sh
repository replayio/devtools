#!/bin/bash

mkdir browsers
mkdir browsers/firefox-1225 # This might need changing if errors happen later when running.
cd browsers/firefox-1225
wget https://replay.io/downloads/macOS-replay-playwright.dmg
wget https://replay.io/downloads/macOS-recordreplay.so
7z x macOS-replay-playwright.dmg # If 7z doesn't exist, try `brew install p7zip` first.
mv Nightly firefox
chmod +x firefox/Nightly.app/Contents/MacOS/firefox
chmod +x firefox/Nightly.app/Contents/MacOS/plugin-container.app/Contents/MacOS/plugin-container
