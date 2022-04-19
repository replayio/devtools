/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const K = 1024;
const M = 1024 * 1024;
const Bps = 1 / 8;
const KBps = K * Bps;
const MBps = M * Bps;

/**
 * Predefined network throttling profiles.
 * Speeds are in bytes per second.  Latency is in ms.
 */
/* eslint-disable key-spacing */
module.exports = [
  {
    download: 50 * KBps,
    id: "GPRS",
    latency: 500,
    upload: 20 * KBps,
  },
  {
    download: 250 * KBps,
    id: "Regular 2G",
    latency: 300,
    upload: 50 * KBps,
  },
  {
    download: 450 * KBps,
    id: "Good 2G",
    latency: 150,
    upload: 150 * KBps,
  },
  {
    download: 750 * KBps,
    id: "Regular 3G",
    latency: 100,
    upload: 250 * KBps,
  },
  {
    download: 1.5 * MBps,
    id: "Good 3G",
    latency: 40,
    upload: 750 * KBps,
  },
  {
    download: 4 * MBps,
    id: "Regular 4G / LTE",
    latency: 20,
    upload: 3 * MBps,
  },
  {
    download: 2 * MBps,
    id: "DSL",
    latency: 5,
    upload: 1 * MBps,
  },
  {
    download: 30 * MBps,
    id: "Wi-Fi",
    latency: 2,
    upload: 15 * MBps,
  },
];
/* eslint-enable key-spacing */
