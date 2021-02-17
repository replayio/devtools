#!/bin/bash

mkdir browsers
mkdir browsers/firefox-1225 # This might need changing if errors happen later when running.
cd browsers/firefox-1225
wget https://replay.io/downloads/macOS-replay-playwright.tar.xz
wget https://replay.io/downloads/macOS-recordreplay.so
tar xf macOS-replay-playwright.tar.xz
