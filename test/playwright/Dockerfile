# Dockerfile to build an image with the replay version of playwright/firefox installed.

FROM mcr.microsoft.com/playwright:focal

# Replace firefox installation
RUN cd /root/.cache/ms-playwright/firefox-1225 && rm -rf firefox && curl https://replay.io/downloads/linux-replay-playwright.tar.xz > firefox.tar.xz && tar xf firefox.tar.xz && rm firefox.tar.xz && cd /

# Download record/replay driver
RUN curl https://replay.io/downloads/linux-recordreplay.so > /root/.cache/ms-playwright/linux-recordreplay.so
ENV RECORD_REPLAY_DRIVER=/root/.cache/ms-playwright/linux-recordreplay.so
