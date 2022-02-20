// modified from https://github.com/evanw/source-map-visualization/blob/7a479ec3631b27cd8b1d97ac2c675ec8d4adccf5/code.js
export default function renderSourcemap(source, sourcemap, url, document) {
  ////////////////////////////////////////////////////////////////////////////////
  // Loading

  const toolbar = document.getElementById('toolbar');
  const statusBar = document.getElementById('statusBar');
  const originalStatus = document.getElementById('originalStatus');
  const generatedStatus = document.getElementById('generatedStatus');

  // Accelerate VLQ decoding with a lookup table
  const vlqTable = new Uint8Array(128);
  const vlqChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < vlqTable.length; i++) vlqTable[i] = 0xFF;
  for (let i = 0; i < vlqChars.length; i++) vlqTable[vlqChars.charCodeAt(i)] = i;

  function decodeMappings(mappings, sourcesCount) {
    const n = mappings.length;
    let data = new Int32Array(1024);
    let dataLength = 0;
    let generatedLine = 0;
    let generatedLineStart = 0;
    let generatedColumn = 0;
    let originalSource = 0;
    let originalLine = 0;
    let originalColumn = 0;
    let originalName = 0;
    let needToSortGeneratedColumns = false;
    let i = 0;

    function decodeError(text) {
      const error = `Invalid VLQ data at index ${i}: ${text}`;
      showLoadingError(`The "mappings" field of the imported source map contains invalid data. ${error}.`);
      throw new Error(error);
    }

    function decodeVLQ() {
      let shift = 0;
      let vlq = 0;

      // Scan over the input
      while (true) {
        // Read a byte
        if (i >= mappings.length) decodeError('Expected extra data');
        const c = mappings.charCodeAt(i);
        if ((c & 0x7F) !== c) decodeError('Invalid character');
        const index = vlqTable[c & 0x7F];
        if (index === 0xFF) decodeError('Invalid character');
        i++;

        // Decode the byte
        vlq |= (index & 31) << shift;
        shift += 5;

        // Stop if there's no continuation bit
        if ((index & 32) === 0) break;
      }

      // Recover the signed value
      return vlq & 1 ? -(vlq >> 1) : vlq >> 1;
    }

    while (i < n) {
      let c = mappings.charCodeAt(i);

      // Handle a line break
      if (c === 59 /* ; */) {
        // The generated columns are very rarely out of order. In that case,
        // sort them with insertion since they are very likely almost ordered.
        if (needToSortGeneratedColumns) {
          for (let j = generatedLineStart + 6; j < dataLength; j += 6) {
            const genL = data[j];
            const genC = data[j + 1];
            const origS = data[j + 2];
            const origL = data[j + 3];
            const origC = data[j + 4];
            const origN = data[j + 5];
            let k = j - 6;
            for (; k >= generatedLineStart && data[k + 1] > genC; k -= 6) {
              data[k + 6] = data[k];
              data[k + 7] = data[k + 1];
              data[k + 8] = data[k + 2];
              data[k + 9] = data[k + 3];
              data[k + 10] = data[k + 4];
              data[k + 11] = data[k + 5];
            }
            data[k + 6] = genL;
            data[k + 7] = genC;
            data[k + 8] = origS;
            data[k + 9] = origL;
            data[k + 10] = origC;
            data[k + 11] = origN;
          }
        }

        generatedLine++;
        generatedColumn = 0;
        generatedLineStart = dataLength;
        needToSortGeneratedColumns = false;
        i++;
        continue;
      }

      // Ignore stray commas
      if (c === 44 /* , */) {
        i++;
        continue;
      }

      // Read the generated column
      const generatedColumnDelta = decodeVLQ();
      if (generatedColumnDelta < 0) needToSortGeneratedColumns = true;
      generatedColumn += generatedColumnDelta;
      if (generatedColumn < 0) decodeError('Invalid generated column');

      // It's valid for a mapping to have 1, 4, or 5 variable-length fields
      let isOriginalSourceMissing = true;
      let isOriginalNameMissing = true;
      if (i < n) {
        c = mappings.charCodeAt(i);
        if (c === 44 /* , */) {
          i++;
        } else if (c !== 59 /* ; */) {
          isOriginalSourceMissing = false;

          // Read the original source
          const originalSourceDelta = decodeVLQ();
          originalSource += originalSourceDelta;
          if (originalSource < 0 || originalSource >= sourcesCount) decodeError('Invalid original source');

          // Read the original line
          const originalLineDelta = decodeVLQ();
          originalLine += originalLineDelta;
          if (originalLine < 0) decodeError('Invalid original line');

          // Read the original column
          const originalColumnDelta = decodeVLQ();
          originalColumn += originalColumnDelta;
          if (originalColumn < 0) decodeError('Invalid original column');

          // Check for the optional name index
          if (i < n) {
            c = mappings.charCodeAt(i);
            if (c === 44 /* , */) {
              i++;
            } else if (c !== 59 /* ; */) {
              isOriginalNameMissing = false;

              // Read the optional name index
              const originalNameDelta = decodeVLQ();
              originalName += originalNameDelta;
              if (originalName < 0) decodeError('Invalid original name');

              // Handle the next character
              if (i < n) {
                c = mappings.charCodeAt(i);
                if (c === 44 /* , */) {
                  i++;
                } else if (c !== 59 /* ; */) {
                  decodeError('Invalid character after mapping');
                }
              }
            }
          }
        }
      }

      // Append the mapping to the typed array
      if (dataLength + 6 > data.length) {
        const newData = new Int32Array(data.length << 1);
        newData.set(data);
        data = newData;
      }
      data[dataLength] = generatedLine;
      data[dataLength + 1] = generatedColumn;
      if (isOriginalSourceMissing) {
        data[dataLength + 2] = -1;
        data[dataLength + 3] = -1;
        data[dataLength + 4] = -1;
      } else {
        data[dataLength + 2] = originalSource;
        data[dataLength + 3] = originalLine;
        data[dataLength + 4] = originalColumn;
      }
      data[dataLength + 5] = isOriginalNameMissing ? -1 : originalName;
      dataLength += 6;
    }

    return data.subarray(0, dataLength);
  }

  function generateInverseMappings(sources, data) {
    let longestDataLength = 0;

    // Scatter the mappings to the individual sources
    for (let i = 0, n = data.length; i < n; i += 6) {
      const originalSource = data[i + 2];
      if (originalSource === -1) continue;

      const source = sources[originalSource];
      let inverseData = source.data;
      let j = source.dataLength;

      // Append the mapping to the typed array
      if (j + 6 > inverseData.length) {
        const newLength = inverseData.length << 1;
        const newData = new Int32Array(newLength > 1024 ? newLength : 1024);
        newData.set(inverseData);
        source.data = inverseData = newData;
      }
      inverseData[j] = data[i];
      inverseData[j + 1] = data[i + 1];
      inverseData[j + 2] = originalSource;
      inverseData[j + 3] = data[i + 3];
      inverseData[j + 4] = data[i + 4];
      inverseData[j + 5] = data[i + 5];
      j += 6;
      source.dataLength = j;
      if (j > longestDataLength) longestDataLength = j;
    }

    // Sort the mappings for each individual source
    const temp = new Int32Array(longestDataLength);
    for (const source of sources) {
      const data = source.data.subarray(0, source.dataLength);

      // Sort lazily for performance
      let isSorted = false;
      Object.defineProperty(source, 'data', {
        get() {
          if (!isSorted) {
            temp.set(data);
            topDownSplitMerge(temp, 0, data.length, data);
            isSorted = true;
          }
          return data;
        },
      })
    }

    // From: https://en.wikipedia.org/wiki/Merge_sort
    function topDownSplitMerge(B, iBegin, iEnd, A) {
      if (iEnd - iBegin <= 6) return;
      const iMiddle = ((iEnd / 6 + iBegin / 6) >> 1) * 6;
      topDownSplitMerge(A, iBegin, iMiddle, B);
      topDownSplitMerge(A, iMiddle, iEnd, B);
      topDownMerge(B, iBegin, iMiddle, iEnd, A);
    }

    // From: https://en.wikipedia.org/wiki/Merge_sort
    function topDownMerge(A, iBegin, iMiddle, iEnd, B) {
      let i = iBegin, j = iMiddle;
      for (let k = iBegin; k < iEnd; k += 6) {
        if (i < iMiddle && (j >= iEnd ||
          // Compare mappings first by original line (index 3) and then by original column (index 4)
          A[i + 3] < A[j + 3] ||
          (A[i + 3] === A[j + 3] && A[i + 4] <= A[j + 4])
        )) {
          B[k] = A[i];
          B[k + 1] = A[i + 1];
          B[k + 2] = A[i + 2];
          B[k + 3] = A[i + 3];
          B[k + 4] = A[i + 4];
          B[k + 5] = A[i + 5];
          i += 6;
        } else {
          B[k] = A[j];
          B[k + 1] = A[j + 1];
          B[k + 2] = A[j + 2];
          B[k + 3] = A[j + 3];
          B[k + 4] = A[j + 4];
          B[k + 5] = A[j + 5];
          j += 6;
        }
      }
    }
  }

  function parseSourceMap(json) {
    try {
      json = JSON.parse(json);
    } catch (e) {
      showLoadingError(`The imported source map contains invalid JSON data: ${e && e.message || e}`);
      throw e;
    }

    // if (json.version !== 3) {
    //   showLoadingError(`The imported source map is invalid. Expected the "version" field to contain the number 3.`);
    //   throw new Error('Invalid source map');
    // }

    if (!(json.sources instanceof Array) || json.sources.some(x => typeof x !== 'string')) {
      showLoadingError(`The imported source map is invalid. Expected the "sources" field to be an array of strings.`);
      throw new Error('Invalid source map');
    }

    if (typeof json.mappings !== 'string') {
      showLoadingError(`The imported source map is invalid. Expected the "mappings" field to be a string.`);
      throw new Error('Invalid source map');
    }

    const { sources, sourcesContent, names, mappings } = json;
    const emptyData = new Int32Array(0);
    for (let i = 0; i < sources.length; i++) {
      sources[i] = {
        name: sources[i],
        content: sourcesContent && sourcesContent[i] || '',
        data: emptyData,
        dataLength: 0,
      };
    }

    const data = decodeMappings(mappings, sources.length);
    generateInverseMappings(sources, data);
    return { sources, names, data };
  }

  const toolbarHeight = 32;
  const statusBarHeight = 32;

  function finishLoading(code, map, url) {
    const startTime = Date.now();
    toolbar.style.display = 'flex';
    statusBar.style.display = 'flex';
    canvas.style.display = 'block';
    const sm = parseSourceMap(map);

    // Populate the file picker
    fileList.innerHTML = '';
    let initialSelectedIndex = -1;
    for (let sources = sm.sources, i = 0, n = sources.length; i < n; i++) {
      const option = document.createElement('option');
      option.textContent = `${i}: ${sources[i].name}`;
      fileList.appendChild(option);
      if (sources[i].name === url) {
        initialSelectedIndex = i;
      }
    }

    // Update the original text area when the source changes
    const otherSource = index => sm.sources[index].name;
    const originalName = index => sm.names[index];
    originalTextArea = null;
    if (sm.sources.length > 0) {
      const updateOriginalSource = () => {
        const source = sm.sources[fileList.selectedIndex];
        originalTextArea = createTextArea({
          sourceIndex: fileList.selectedIndex,
          text: source.content,
          mappings: source.data,
          mappingsOffset: 3,
          otherSource,
          originalName,
          bounds() {
            return {
              x: 0,
              y: toolbarHeight,
              width: (innerWidth >>> 1) - (splitterWidth >> 1),
              height: innerHeight - toolbarHeight - statusBarHeight,
            };
          },
        });
        isInvalid = true;
      };
      setTimeout(() => {
        if (initialSelectedIndex >= 0) {
          fileList.selectedIndex = initialSelectedIndex;
        }
        fileList.onchange = updateOriginalSource;
        updateOriginalSource();
      }, 0);
    } else {
      const option = document.createElement('option');
      option.textContent = `(no original code)`;
      option.disabled = true;
      fileList.appendChild(option);
    }
    fileList.selectedIndex = 0;

    generatedTextArea = createTextArea({
      sourceIndex: null,
      text: code,
      mappings: sm.data,
      mappingsOffset: 0,
      otherSource,
      originalName,
      bounds() {
        const x = (innerWidth >> 1) + ((splitterWidth + 1) >> 1);
        return {
          x,
          y: toolbarHeight,
          width: innerWidth - x,
          height: innerHeight - toolbarHeight - statusBarHeight,
        };
      },
    });

    isInvalid = true;
    const endTime = Date.now();
    console.log(`Finished loading in ${endTime - startTime}ms`);
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Drawing

  const originalLineColors = [
    'rgba(25, 133, 255, 0.3)', // Blue
    'rgba(174, 97, 174, 0.3)', // Purple
    'rgba(255, 97, 106, 0.3)', // Red
    'rgba(250, 192, 61, 0.3)', // Yellow
    'rgba(115, 192, 88, 0.3)', // Green
  ];

  // Use a striped pattern for bad mappings (good mappings are solid)
  const patternContours = [
    [0, 24, 24, 0, 12, 0, 0, 12, 0, 24],
    [0, 28, 28, 0, 40, 0, 0, 40, 0, 28],
    [0, 44, 44, 0, 56, 0, 0, 56, 0, 44],
    [12, 64, 24, 64, 64, 24, 64, 12, 12, 64],
    [0, 60, 0, 64, 8, 64, 64, 8, 64, 0, 60, 0, 0, 60],
    [28, 64, 40, 64, 64, 40, 64, 28, 28, 64],
    [0, 8, 8, 0, 0, 0, 0, 8],
    [44, 64, 56, 64, 64, 56, 64, 44, 44, 64],
    [64, 64, 64, 60, 60, 64, 64, 64],
  ];
  const badMappingPatterns = originalLineColors.map(color => {
    let patternCanvas = document.createElement('canvas');
    let patternContext = patternCanvas.getContext('2d');
    let ratio, scale, pattern;
    return (dx, dy) => {
      if (devicePixelRatio !== ratio) {
        ratio = devicePixelRatio;
        scale = Math.round(64 * ratio) / 64;
        patternCanvas.width = patternCanvas.height = Math.round(64 * scale);
        patternContext.scale(scale, scale);
        patternContext.beginPath();
        for (const contour of patternContours) {
          for (let i = 0; i < contour.length; i += 2) {
            if (i === 0) patternContext.moveTo(contour[i], contour[i + 1]);
            else patternContext.lineTo(contour[i], contour[i + 1]);
          }
        }
        patternContext.fillStyle = color.replace(' 0.3)', ' 0.2)');
        patternContext.fill();
        pattern = c.createPattern(patternCanvas, 'repeat');
      }
      pattern.setTransform(new DOMMatrix([1 / scale, 0, 0, 1 / scale, dx, dy]));
      return pattern;
    };
  });

  const canvas = document.createElement('canvas');
  const c = canvas.getContext('2d');
  const monospaceFont = '14px monospace';
  const rowHeight = 21;
  const splitterWidth = 6;
  const margin = 64;
  let isInvalid = true;
  let originalTextArea;
  let generatedTextArea;
  let hover = null;

  function splitTextIntoLinesAndRuns(text) {
    c.font = monospaceFont;
    const spaceWidth = c.measureText(' ').width;
    const spacesPerTab = 2;
    const lines = text.split(/\r\n|\r|\n/g);
    const unicodeWidthCache = new Map();
    let longestLineInColumns = 0;

    for (let line = 0; line < lines.length; line++) {
      let raw = lines[line];
      let runs = [];
      let i = 0;
      let n = raw.length + 1; // Add 1 for the extra character at the end
      let column = 0;

      while (i < n) {
        let startIndex = i;
        let startColumn = column;
        let whitespace = 0;
        let isSingleChunk = false;

        while (i < n) {
          let c1 = raw.charCodeAt(i);
          let c2;

          // Draw each tab into its own run
          if (c1 === 0x09 /* tab */) {
            if (i > startIndex) break;
            isSingleChunk = true;
            column += spacesPerTab;
            column -= column % spacesPerTab;
            i++;
            whitespace = c1;
            break;
          }

          // Draw each newline into its own run
          if (c1 !== c1 /* end of line */) {
            if (i > startIndex) break;
            isSingleChunk = true;
            column++;
            i++;
            whitespace = 0x0A /* newline */;
            break;
          }

          // Draw each non-ASCII character into its own run (e.g. emoji)
          if (c1 < 0x20 || c1 > 0x7E) {
            if (i > startIndex) break;
            isSingleChunk = true;
            i++;

            // Consume another code unit if this code unit is a high surrogate
            // and the next code point is a low surrogate. This handles code
            // points that span two UTF-16 code units.
            if (i < n && c1 >= 0xD800 && c1 <= 0xDBFF && (c2 = raw.charCodeAt(i)) >= 0xDC00 && c2 <= 0xDFFF) {
              i++;
            }

            // This contains some logic to handle more complex emoji such as "👯‍♂️"
            // which is [U+1F46F, U+200D, U+2642, U+FE0F].
            while (i < n) {
              c1 = raw.charCodeAt(i);

              // Consume another code unit if the next code point is a variation selector
              if ((c1 & ~0xF) === 0xFE00) {
                i++;
              }

              // Consume another code unit if the next code point is a skin tone modifier
              else if (c1 === 0xD83C && i + 1 < n && (c2 = raw.charCodeAt(i + 1)) >= 0xDFFB && c2 <= 0xDFFF) {
                i += 2;
              }

              // Consume another code unit and stop if the next code point is a zero-width non-joiner
              else if (c1 === 0x200C) {
                i++;
                break;
              }

              // Consume another code unit if the next code point is a zero-width joiner
              else if (c1 === 0x200D) {
                i++;

                // Consume the next code point that is "joined" to this one
                if (i < n) {
                  c1 = raw.charCodeAt(i);
                  i++;
                  if (c1 >= 0xD800 && c1 <= 0xDBFF && i < n && (c2 = raw.charCodeAt(i)) >= 0xDC00 && c2 <= 0xDFFF) {
                    i++;
                  }
                }
              }

              else {
                break;
              }
            }

            const key = raw.slice(startIndex, i);
            let width = unicodeWidthCache.get(key);
            if (width === void 0) {
              width = Math.round(c.measureText(key).width / spaceWidth);
              if (width < 1) width = 1;
              unicodeWidthCache.set(key, width);
            }
            column += width;
            break;
          }

          // Draw runs of spaces in their own run
          if (c1 === 0x20 /* space */) {
            if (i === startIndex) whitespace = c1;
            else if (!whitespace) break;
          } else {
            if (whitespace) break;
          }

          column++;
          i++;
        }

        runs.push({
          whitespace,
          startIndex, endIndex: i,
          startColumn, endColumn: column,
          isSingleChunk,
          text:
            !whitespace ? raw.slice(startIndex, i) :
              whitespace === 0x20 /* space */ ? '·'.repeat(i - startIndex) :
                whitespace === 0x0A /* newline */ ? line + 1 === lines.length ? '∅' : '↵' :
                  '→' /* tab */,
        });
      }

      lines[line] = { raw, runs, endIndex: i, endColumn: column };
      longestLineInColumns = Math.max(longestLineInColumns, column);
    }

    return { lines, longestLineInColumns };
  }

  function createTextArea({ sourceIndex, text, mappings, mappingsOffset, otherSource, originalName, bounds }) {
    const shadowWidth = 16;
    const textPaddingX = 5;
    const textPaddingY = 1;
    const scrollbarThickness = 16;
    let { lines, longestLineInColumns } = splitTextIntoLinesAndRuns(text);
    let animate = null;
    let lastLineIndex = lines.length - 1;
    let scrollX = 0;
    let scrollY = 0;

    for (let i = 0, n = mappings.length; i < n; i += 6) {
      let line = mappings[i + mappingsOffset];
      let column = mappings[i + mappingsOffset + 1];
      if (line < lines.length) {
        const { endIndex, endColumn } = lines[line]

        // Take into account tabs tops and surrogate pairs
        if (column > endColumn) {
          column = column - endIndex + endColumn;
        }
      } else if (line > lastLineIndex) {
        lastLineIndex = line;
      }
      if (column > longestLineInColumns) {
        longestLineInColumns = column;
      }
    }

    function computeScrollbarsAndClampScroll() {
      let { width, height } = bounds();
      c.font = '14px monospace';
      let columnWidth = c.measureText(' '.repeat(64)).width / 64;
      let maxScrollX = Math.round(longestLineInColumns * columnWidth + textPaddingX * 2 + margin + scrollbarThickness - width);
      let maxScrollY = Math.round(lastLineIndex * rowHeight);
      let scrollbarX = null;
      let scrollbarY = null;

      scrollX = Math.max(0, Math.min(scrollX, maxScrollX));
      scrollY = Math.max(0, Math.min(scrollY, maxScrollY));

      if (maxScrollX > 0) {
        const trackLength = width - margin - scrollbarThickness / 2;
        scrollbarX = {
          trackLength,
          thumbLength: Math.max(scrollbarThickness * 2, trackLength / (1 + maxScrollX / trackLength)),
        };
      }

      if (maxScrollY > 0) {
        const trackLength = height - scrollbarThickness / 2;
        scrollbarY = {
          trackLength,
          thumbLength: Math.max(scrollbarThickness * 2, trackLength / (1 + maxScrollY / trackLength)),
        };
      }

      return { columnWidth, maxScrollX, maxScrollY, scrollbarX, scrollbarY };
    }

    const emptyArray = [];

    function analyzeLine(row, column, fractionalColumn, tabStopBehavior) {
      let index = column;
      let firstRun = 0;
      let nearbyRun = 0;
      let runs = row < lines.length ? lines[row].runs : emptyArray;
      let runCount = runs.length;
      let endOfLineIndex = 0;
      let endOfLineColumn = 0;
      let beforeNewlineIndex = 0;
      let hasTrailingNewline = false;

      if (runCount > 0) {
        let lastRun = runs[runCount - 1];
        endOfLineIndex = lastRun.endIndex;
        endOfLineColumn = lastRun.endColumn;
        beforeNewlineIndex = lastRun.startIndex;
        hasTrailingNewline = lastRun.whitespace === 0x0A /* newline */;

        // Binary search to find the first run
        firstRun = 0;
        while (runCount > 0) {
          let step = runCount >> 1;
          let it = firstRun + step;
          if (runs[it].endColumn < column) {
            firstRun = it + 1;
            runCount -= step + 1;
          } else {
            runCount = step;
          }
        }

        // Use the last run if we're past the end of the line
        if (firstRun >= runs.length) firstRun--;

        // Convert column to index
        nearbyRun = firstRun;
        while (runs[nearbyRun].startColumn > column && nearbyRun > 0) nearbyRun--;
        while (runs[nearbyRun].endColumn < column && nearbyRun + 1 < runs.length) nearbyRun++;
        let run = runs[nearbyRun];
        if (run.isSingleChunk && column <= run.endColumn) {
          // A special case for single-character blocks such as tabs and emoji
          if (
            (tabStopBehavior === 'round' && fractionalColumn >= (run.startColumn + run.endColumn) / 2) ||
            (tabStopBehavior === 'floor' && fractionalColumn >= run.endColumn)
          ) {
            index = run.endIndex;
            column = run.endColumn;
          } else {
            index = run.startIndex;
            column = run.startColumn;
          }
        } else {
          index = run.startIndex + column - run.startColumn;
        }
      }

      // Binary search to find the first mapping that is >= index
      let firstMapping = 0;
      let mappingCount = mappings.length;
      while (mappingCount > 0) {
        let step = ((mappingCount / 6) >> 1) * 6;
        let it = firstMapping + step;
        let mappingLine = mappings[it + mappingsOffset];
        if (mappingLine < row || (mappingLine === row && mappings[it + mappingsOffset + 1] < index)) {
          firstMapping = it + 6;
          mappingCount -= step + 6;
        } else {
          mappingCount = step;
        }
      }

      // Back up to the previous mapping if we're at the end of the line or the mapping we found is after us
      if (firstMapping > 0 && mappings[firstMapping - 6 + mappingsOffset] === row && (
        firstMapping >= mappings.length ||
        mappings[firstMapping + mappingsOffset] > row ||
        mappings[firstMapping + mappingsOffset + 1] > index
      )) {
        firstMapping -= 6;
      }

      // Seek to the first of any duplicate mappings
      const current = mappings[firstMapping + mappingsOffset + 1];
      while (firstMapping > 0 && mappings[firstMapping - 6 + mappingsOffset] === row && mappings[firstMapping - 6 + mappingsOffset + 1] === current) {
        firstMapping -= 6;
      }

      function columnToIndex(column) {
        // If there is no underlying line, just use one index per column
        let index = column;
        if (runs.length > 0) {
          while (runs[nearbyRun].startColumn > column && nearbyRun > 0) nearbyRun--;
          while (runs[nearbyRun].endColumn < column && nearbyRun + 1 < runs.length) nearbyRun++;
          let run = runs[nearbyRun];
          index = column === run.endColumn ? run.endIndex : run.endIndex + column - run.startColumn;
        }
        return index;
      }

      function indexToColumn(index) {
        // If there is no underlying line, just use one column per index
        let column = index;
        if (runs.length > 0) {
          while (runs[nearbyRun].startIndex > index && nearbyRun > 0) nearbyRun--;
          while (runs[nearbyRun].endIndex < index && nearbyRun + 1 < runs.length) nearbyRun++;
          let run = runs[nearbyRun];
          column = index === run.endIndex ? run.endColumn : run.startColumn + index - run.startIndex;
        }
        return column;
      }

      function rangeOfMapping(map) {
        if (mappings[map + mappingsOffset] !== row) return null;
        let startIndex = mappings[map + mappingsOffset + 1];
        let endIndex =
          startIndex > endOfLineIndex ? startIndex :
            hasTrailingNewline && startIndex < beforeNewlineIndex ? beforeNewlineIndex :
              endOfLineIndex;
        let isLastMappingInLine = false;

        // Ignore subsequent duplicate mappings
        if (map > 0 && mappings[map - 6 + mappingsOffset] === row && mappings[map - 6 + mappingsOffset + 1] === startIndex) {
          return null;
        }

        // Skip past any duplicate mappings after us so we can get to the next non-duplicate mapping
        while (map + 6 < mappings.length && mappings[map + 6 + mappingsOffset] === row && mappings[map + 6 + mappingsOffset + 1] === startIndex) {
          map += 6;
        }

        // Extend this mapping up to the next mapping if it's on the same line
        if (map + 6 < mappings.length && mappings[map + 6 + mappingsOffset] === row) {
          endIndex = mappings[map + 6 + mappingsOffset + 1];
        } else if (endIndex === startIndex) {
          isLastMappingInLine = true;
        }

        return {
          startIndex, startColumn: indexToColumn(startIndex),
          endIndex, endColumn: indexToColumn(endIndex),
          isLastMappingInLine,
        };
      }

      return {
        index,
        column,
        firstRun,
        runs,
        firstMapping,
        endOfLineIndex,
        endOfLineColumn,
        columnToIndex,
        indexToColumn,
        rangeOfMapping,
      };
    }

    function boxForRange(x, y, row, columnWidth, { startColumn, endColumn }) {
      const x1 = Math.round(x - scrollX + margin + textPaddingX + startColumn * columnWidth + 1);
      const x2 = Math.round(x - scrollX + margin + textPaddingX + (startColumn === endColumn ? startColumn * columnWidth + 4 : endColumn * columnWidth) - 1);
      const y1 = Math.round(y + textPaddingY - scrollY + row * rowHeight + 2);
      const y2 = Math.round(y + textPaddingY - scrollY + (row + 1) * rowHeight - 2);
      return [x1, y1, x2, y2];
    }

    return {
      sourceIndex,
      bounds,

      getHoverRect() {
        const row = sourceIndex === null ? hover.mapping.generatedLine : hover.mapping.originalLine;
        const index = sourceIndex === null ? hover.mapping.generatedColumn : hover.mapping.originalColumn;
        const column = analyzeLine(row, index, index, 'floor').indexToColumn(index);
        const { firstMapping, rangeOfMapping } = analyzeLine(row, column, column, 'floor');
        const range = rangeOfMapping(firstMapping);
        if (!range) return null;
        const { x, y } = bounds();
        const { columnWidth } = computeScrollbarsAndClampScroll();
        const [x1, y1, x2, y2] = boxForRange(x, y, row, columnWidth, range);
        return [x1, y1, x2 - x1, y2 - y1];
      },

      onwheel(e) {
        let { x, y, width, height } = bounds();
        if (e.pageX >= x && e.pageX < x + width && e.pageY >= y && e.pageY < y + height) {
          scrollX = Math.round(scrollX + e.deltaX);
          scrollY = Math.round(scrollY + e.deltaY);
          computeScrollbarsAndClampScroll();
          isInvalid = true;
          this.onmousemove(e);
        }
      },

      onmousemove(e) {
        const { x, y, width, height } = bounds();

        if (e.pageX >= x + margin && e.pageX < x + width && e.pageY >= y && e.pageY < y + height) {
          const { columnWidth } = computeScrollbarsAndClampScroll();
          const fractionalColumn = (e.pageX - x - margin - textPaddingX + scrollX) / columnWidth;
          const roundedColumn = Math.round(fractionalColumn);

          if (roundedColumn >= 0) {
            const row = Math.floor((e.pageY - y - textPaddingY + scrollY) / rowHeight);

            if (row >= 0) {
              const flooredColumn = Math.floor(fractionalColumn);
              const { index: snappedRoundedIndex, column: snappedRoundedColumn } = analyzeLine(row, roundedColumn, fractionalColumn, 'round');
              const { index: snappedFlooredIndex, firstMapping, rangeOfMapping } = analyzeLine(row, flooredColumn, fractionalColumn, 'floor');

              // Check to see if this nearest mapping is being hovered
              let mapping = null;
              const range = rangeOfMapping(firstMapping);
              if (range !== null && (
                // If this is a zero-width mapping, hit-test with the caret
                (range.isLastMappingInLine && range.startIndex === snappedRoundedIndex) ||

                // Otherwise, determine the bounding-box and hit-test against that
                (snappedFlooredIndex >= range.startIndex && snappedFlooredIndex < range.endIndex)
              )) {
                mapping = {
                  generatedLine: mappings[firstMapping],
                  generatedColumn: mappings[firstMapping + 1],
                  originalSource: mappings[firstMapping + 2],
                  originalLine: mappings[firstMapping + 3],
                  originalColumn: mappings[firstMapping + 4],
                  originalName: mappings[firstMapping + 5],
                };
              }

              hover = { sourceIndex, row, column: snappedRoundedColumn, index: snappedRoundedIndex, mapping };
            }
          }
        }
      },

      onmousedown(e) {
        const { x, y, width, height } = bounds();
        const px = e.pageX - x;
        const py = e.pageY - y;
        if (px < 0 || py < 0 || px >= width || py >= height) return;
        const { maxScrollX, maxScrollY, scrollbarX, scrollbarY } = computeScrollbarsAndClampScroll();

        // Handle scrollbar dragging
        let mousemove;
        if (scrollbarX && py > height - scrollbarThickness) {
          let originalScrollX = scrollX;
          mousemove = e => {
            scrollX = Math.round(originalScrollX + (e.pageX - x - px) * maxScrollX / (scrollbarX.trackLength - scrollbarX.thumbLength));
            computeScrollbarsAndClampScroll();
            isInvalid = true;
          };
        } else if (scrollbarY && px > width - scrollbarThickness) {
          let originalScrollY = scrollY;
          mousemove = e => {
            scrollY = Math.round(originalScrollY + (e.pageY - y - py) * maxScrollY / (scrollbarY.trackLength - scrollbarY.thumbLength));
            computeScrollbarsAndClampScroll();
            isInvalid = true;
          };
        } else {
          // Scroll to the hover target on click
          if (hover && hover.mapping) {
            if (sourceIndex !== null) {
              generatedTextArea.scrollTo(hover.mapping.generatedColumn, hover.mapping.generatedLine);
            } else {
              if (originalTextArea.sourceIndex !== hover.mapping.originalSource) {
                fileList.selectedIndex = hover.mapping.originalSource;
                fileList.onchange();
              }
              originalTextArea.scrollTo(hover.mapping.originalColumn, hover.mapping.originalLine);
            }
          }
          return;
        }

        let mouseup = () => {
          document.removeEventListener('mousemove', mousemove);
          document.removeEventListener('mouseup', mouseup);
        };
        document.addEventListener('mousemove', mousemove);
        document.addEventListener('mouseup', mouseup);
        e.preventDefault();
      },

      scrollTo(index, row) {
        const start = Date.now();
        const startX = scrollX;
        const startY = scrollY;
        const { width, height } = bounds();
        const { columnWidth } = computeScrollbarsAndClampScroll();
        const { indexToColumn } = analyzeLine(row, index, index, 'floor');
        const column = indexToColumn(index);
        const { firstMapping, rangeOfMapping } = analyzeLine(row, column, column, 'floor');
        const range = rangeOfMapping(firstMapping);
        const targetColumn = range ? range.startColumn + Math.min((range.endColumn - range.startColumn) / 2, (width - margin) / 4 / columnWidth) : column;
        const endX = Math.max(0, Math.round(targetColumn * columnWidth - (width - margin) / 2));
        const endY = Math.max(0, Math.round((row + 0.5) * rowHeight - height / 2));
        if (startX === endX && startY === endY) return;
        const duration = 250;
        animate = () => {
          isInvalid = true;
          const current = Date.now();
          let t = (current - start) / duration;
          if (t >= 1) {
            scrollX = endX;
            scrollY = endY;
            animate = null;
          } else {
            t *= t * (3 - 2 * t); // Use an ease-in-out curve
            scrollX = startX + (endX - startX) * t;
            scrollY = startY + (endY - startY) * t;
          }
        };
        animate();
      },

      draw(bodyStyle) {
        if (animate) animate();

        const { x, y, width, height } = bounds();
        const textColor = bodyStyle.color;
        const backgroundColor = bodyStyle.backgroundColor;
        const { columnWidth, maxScrollX, maxScrollY, scrollbarX, scrollbarY } = computeScrollbarsAndClampScroll();

        const firstColumn = Math.max(0, Math.floor((scrollX - textPaddingX) / columnWidth));
        const lastColumn = Math.max(0, Math.ceil((scrollX - textPaddingX + width - margin) / columnWidth));
        const firstRow = Math.max(0, Math.floor((scrollY - textPaddingY) / rowHeight));
        const lastRow = Math.max(0, Math.ceil((scrollY - textPaddingY + height) / rowHeight));

        // Populate batches for the text
        const hoverBoxes = [];
        const hoveredMapping = hover && hover.mapping;
        const mappingBatches = [];
        const badMappingBatches = [];
        const whitespaceBatch = [];
        const textBatch = [];
        for (let i = 0; i < originalLineColors.length; i++) {
          mappingBatches.push([]);
          badMappingBatches.push([]);
        }
        for (let row = firstRow; row <= lastRow; row++) {
          let dx = x - scrollX + margin + textPaddingX;
          let dy = y - scrollY + textPaddingY;
          dy += (row + 0.7) * rowHeight;
          const { firstRun, runs, firstMapping, endOfLineColumn, rangeOfMapping, columnToIndex } = analyzeLine(row, firstColumn, firstColumn, 'floor');
          const lastIndex = columnToIndex(lastColumn);

          // Don't draw any text if the whole line is offscreen
          if (firstRun < runs.length) {
            // Scan to find the last run
            let lastRun = firstRun;
            while (lastRun + 1 < runs.length && runs[lastRun + 1].startColumn < lastColumn) {
              lastRun++;
            }

            // Draw the runs
            let currentColumn = firstColumn;
            for (let run = firstRun; run <= lastRun; run++) {
              let { whitespace, text, startColumn, endColumn, isSingleChunk } = runs[run];

              // Limit the run to the visible columns (but only for ASCII runs)
              if (!isSingleChunk) {
                if (startColumn < currentColumn) {
                  text = text.slice(currentColumn - startColumn);
                  startColumn = currentColumn;
                }
                if (endColumn > lastColumn) {
                  text = text.slice(0, lastColumn - startColumn);
                  endColumn = lastColumn;
                }
              }

              // Draw whitespace in a separate batch
              (whitespace ? whitespaceBatch : textBatch).push(text, dx + startColumn * columnWidth, dy);
              currentColumn = endColumn;
            }
          }

          // Draw the mappings
          for (let map = firstMapping; map < mappings.length; map += 6) {
            if (mappings[map + mappingsOffset] !== row || mappings[map + mappingsOffset + 1] >= lastIndex) break;
            if (mappings[map + 2] === -1) continue;

            // Get the bounds of this mapping, which may be empty if it's ignored
            const range = rangeOfMapping(map);
            if (range === null) continue;

            // Check if this mapping is hovered
            let isHovered = false;
            if (hoveredMapping) {
              const isGenerated = sourceIndex === null;
              const hoverIsGenerated = hover.sourceIndex === null;
              const matchesGenerated =
                mappings[map] === hoveredMapping.generatedLine &&
                mappings[map + 1] === hoveredMapping.generatedColumn;
              const matchesOriginal =
                mappings[map + 2] === hoveredMapping.originalSource &&
                mappings[map + 3] === hoveredMapping.originalLine &&
                mappings[map + 4] === hoveredMapping.originalColumn;
              isHovered = hoveredMapping && (isGenerated !== hoverIsGenerated
                // If this is on the opposite pane from the mouse, show all
                // mappings that match the hovered mapping instead of showing
                // an exact match.
                ? matchesGenerated || matchesOriginal
                // If this is on the same pane as the mouse, only show the exact
                // mapping instead of showing everything that matches the target
                // so hovering isn't confusing.
                : isGenerated ? matchesGenerated : matchesOriginal);
            }

            // Add a rectangle to that color's batch
            const { startColumn, endColumn } = range;
            const color = mappings[map + 3] % originalLineColors.length;
            const [x1, y1, x2, y2] = boxForRange(x, y, row, columnWidth, range);
            if (isHovered) {
              hoverBoxes.push({ color, rect: [x1 - 2, y1 - 2, x2 - x1 + 4, y2 - y1 + 4] });
            } else if (row >= lines.length || startColumn > endOfLineColumn) {
              badMappingBatches[color].push(x1, y1, x2 - x1, y2 - y1);
            } else if (endColumn > endOfLineColumn) {
              let x12 = Math.round(x1 + (endOfLineColumn - startColumn) * columnWidth);
              mappingBatches[color].push(x1, y1, x12 - x1, y2 - y1);
              badMappingBatches[color].push(x12, y1, x2 - x12, y2 - y1);
            } else {
              mappingBatches[color].push(x1, y1, x2 - x1, y2 - y1);
            }
          }
        }

        c.save();
        c.beginPath();
        c.rect(x, y, width, height);
        c.clip();

        // Flush batches for mappings
        for (let i = 0; i < mappingBatches.length; i++) {
          let batch = mappingBatches[i];
          if (batch.length > 0) {
            c.fillStyle = originalLineColors[i];
            for (let j = 0; j < batch.length; j += 4) {
              c.fillRect(batch[j], batch[j + 1], batch[j + 2], batch[j + 3]);
            }
          }
          batch = badMappingBatches[i];
          if (batch.length > 0) {
            c.fillStyle = badMappingPatterns[i](-scrollX, -scrollY);
            for (let j = 0; j < batch.length; j += 4) {
              c.fillRect(batch[j], batch[j + 1], batch[j + 2], batch[j + 3]);
            }
          }
        }

        let status = '';

        // Draw the hover box for all text areas
        if (hoverBoxes.length > 0) {
          // Draw the glows
          c.shadowBlur = 20;
          c.fillStyle = 'black';
          for (const { rect: [rx, ry, rw, rh], color } of hoverBoxes) {
            c.shadowColor = originalLineColors[color].replace(' 0.3)', ' 1)');
            c.fillRect(rx - 1, ry - 1, rw + 2, rh + 2);
          }
          c.shadowColor = 'transparent';

          // Hollow out the boxes and draw a border around each one
          for (const { rect: [rx, ry, rw, rh] } of hoverBoxes) {
            c.clearRect(rx, ry, rw, rh);
          }
          c.strokeStyle = textColor;
          c.lineWidth = 2;
          for (const { rect: [rx, ry, rw, rh] } of hoverBoxes) {
            c.strokeRect(rx, ry, rw, rh);
          }

          // Hollow out the boxes again. This is necessary to remove overlapping
          // borders from adjacent boxes due to duplicate mappings.
          for (const { rect: [rx, ry, rw, rh] } of hoverBoxes) {
            c.clearRect(rx + 2, ry + 1, rw - 4, rh - 2);
          }
        }

        // Draw the hover caret, but only for this text area
        else if (hover && hover.sourceIndex === sourceIndex) {
          const caretX = Math.round(x - scrollX + margin + textPaddingX + hover.column * columnWidth);
          const caretY = Math.round(y - scrollY + textPaddingY + hover.row * rowHeight);
          c.fillStyle = textColor;
          c.globalAlpha = 0.5;
          c.fillRect(caretX, caretY, 1, rowHeight);
          c.globalAlpha = 1;
          status = `Line ${hover.row + 1}, Offset ${hover.index}`;
        }

        // Update the status bar
        if (hoveredMapping) {
          if (sourceIndex === null) {
            status = `Line ${hoveredMapping.generatedLine + 1}, Offset ${hoveredMapping.generatedColumn}`;
            if (hoveredMapping.originalName !== -1) {
              status += `, Name ${originalName(hoveredMapping.originalName)}`;
            }
          } else {
            status = `Line ${hoveredMapping.originalLine + 1}, Offset ${hoveredMapping.originalColumn}`;
            if (hoveredMapping.originalSource !== sourceIndex) {
              status += ` in ${otherSource(hoveredMapping.originalSource)}`;
            }
          }
        }
        (sourceIndex === null ? generatedStatus : originalStatus).textContent = status;

        // Flush batches for the text
        c.textBaseline = 'alphabetic';
        c.textAlign = 'left';
        if (whitespaceBatch.length > 0) {
          c.fillStyle = 'rgba(150, 150, 150, 0.4)';
          for (let j = 0; j < whitespaceBatch.length; j += 3) {
            c.fillText(whitespaceBatch[j], whitespaceBatch[j + 1], whitespaceBatch[j + 2]);
          }
        }
        if (textBatch.length > 0) {
          c.fillStyle = textColor;
          for (let j = 0; j < textBatch.length; j += 3) {
            c.fillText(textBatch[j], textBatch[j + 1], textBatch[j + 2]);
          }
        }

        // Draw the margin shadow
        if (scrollX > 0) {
          let gradient = c.createLinearGradient(x + margin, 0, x + margin + shadowWidth, 0);
          for (let i = 0; i <= 10; i++) {
            let t = i / 10;
            gradient.addColorStop(t, `rgba(0, 0, 0, ${(1 - t) * (1 - t) * 0.2})`);
          }
          c.fillStyle = gradient;
          c.fillRect(x + margin, y, shadowWidth, height);
        }

        // Draw the scrollbars
        if (scrollbarX) {
          let dx = x + margin + scrollX / maxScrollX * (scrollbarX.trackLength - scrollbarX.thumbLength);
          let dy = y + height - scrollbarThickness;
          c.fillStyle = 'rgba(127, 127, 127, 0.5)';
          c.beginPath();
          c.arc(dx + scrollbarThickness / 2, dy + scrollbarThickness / 2, scrollbarThickness / 4, Math.PI / 2, Math.PI * 3 / 2, false);
          c.arc(dx + scrollbarX.thumbLength - scrollbarThickness / 2, dy + scrollbarThickness / 2, scrollbarThickness / 4, -Math.PI / 2, Math.PI / 2, false);
          c.fill();
        }
        if (scrollbarY) {
          let dx = x + width - scrollbarThickness;
          let dy = y + scrollY / maxScrollY * (scrollbarY.trackLength - scrollbarY.thumbLength);
          c.fillStyle = 'rgba(127, 127, 127, 0.5)';
          c.beginPath();
          c.arc(dx + scrollbarThickness / 2, dy + scrollbarThickness / 2, scrollbarThickness / 4, -Math.PI, 0, false);
          c.arc(dx + scrollbarThickness / 2, dy + scrollbarY.thumbLength - scrollbarThickness / 2, scrollbarThickness / 4, 0, Math.PI, false);
          c.fill();
        }

        // Draw the margin
        c.fillStyle = backgroundColor;
        c.fillRect(x, y, margin, height);
        c.fillStyle = 'rgba(127, 127, 127, 0.1)';
        c.fillRect(x, y, margin, height);
        c.fillStyle = 'rgba(127, 127, 127, 0.5)';
        c.fillRect(x + margin - 1, y, 1, height);
        c.textAlign = 'right';
        c.fillStyle = textColor;
        c.font = '11px monospace';
        for (let row = firstRow; row <= lastRow && row <= lastLineIndex; row++) {
          let dx = x + margin - textPaddingX;
          let dy = y - scrollY + textPaddingY;
          dy += (row + 0.6) * rowHeight;
          c.globalAlpha = row < lines.length ? 0.625 : 0.25;
          c.fillText((row + 1).toString(), dx, dy);
        }
        c.font = monospaceFont;
        c.globalAlpha = 1;

        c.restore();
      },
    };
  }

  function draw() {
    requestAnimationFrame(draw);
    if (!isInvalid) return;
    isInvalid = false;

    c.clearRect(0, 0, innerWidth, innerHeight);
    if (!generatedTextArea) return;

    const bodyStyle = getComputedStyle(document.body);
    if (originalTextArea) originalTextArea.draw(bodyStyle);
    generatedTextArea.draw(bodyStyle);

    // Draw the splitter
    c.fillStyle = 'rgba(127, 127, 127, 0.2)';
    c.fillRect((innerWidth >>> 1) - (splitterWidth >> 1), toolbarHeight, splitterWidth, innerHeight - toolbarHeight - statusBarHeight);

    // Draw the arrow between the two hover areas
    if (hover && hover.mapping && originalTextArea && originalTextArea.sourceIndex === hover.mapping.originalSource) {
      const originalHoverRect = originalTextArea.getHoverRect();
      const generatedHoverRect = generatedTextArea.getHoverRect();
      if (originalHoverRect && generatedHoverRect) {
        const textColor = bodyStyle.color;
        const originalBounds = originalTextArea.bounds();
        const generatedBounds = generatedTextArea.bounds();
        const originalArrowHead = hover.sourceIndex === generatedTextArea.sourceIndex;
        const generatedArrowHead = hover.sourceIndex === originalTextArea.sourceIndex;
        const [ox, oy, ow, oh] = originalHoverRect;
        const [gx, gy, , gh] = generatedHoverRect;
        const x1 = Math.min(ox + ow, originalBounds.x + originalBounds.width) + (originalArrowHead ? 10 : 2);
        const x2 = Math.max(gx, generatedBounds.x + margin) - (generatedArrowHead ? 10 : 2);
        const y1 = oy + oh / 2;
        const y2 = gy + gh / 2;

        c.save();
        c.beginPath();
        c.rect(0, toolbarHeight, innerWidth, innerHeight - toolbarHeight - statusBarHeight);
        c.clip();

        // Draw the curve
        c.beginPath();
        c.moveTo(x1, y1);
        c.bezierCurveTo(
          (x1 + 2 * x2) / 3 + margin / 2, y1,
          (x1 * 2 + x2) / 3 - margin / 2, y2,
          x2, y2);
        c.strokeStyle = textColor;
        c.lineWidth = 2;
        c.stroke();

        // Draw the arrow heads
        c.beginPath();
        if (originalArrowHead) {
          c.moveTo(x1 - 10, y1);
          c.lineTo(x1, y1 + 5);
          c.lineTo(x1, y1 - 5);
        }
        if (generatedArrowHead) {
          c.moveTo(x2 + 10, y2);
          c.lineTo(x2, y2 + 5);
          c.lineTo(x2, y2 - 5);
        }
        c.fillStyle = textColor;
        c.fill();

        c.restore();
      }
    }
  }

  document.onmousemove = e => {
    let oldHover = hover;
    hover = null;

    if (originalTextArea) originalTextArea.onmousemove(e);
    if (generatedTextArea) generatedTextArea.onmousemove(e);

    if (JSON.stringify(hover) !== JSON.stringify(oldHover)) {
      isInvalid = true;
    }
  };

  document.onmousedown = e => {
    if (originalTextArea) originalTextArea.onmousedown(e);
    if (generatedTextArea) generatedTextArea.onmousedown(e);
  };

  onblur = () => {
    if (hover) {
      hover = null;
      isInvalid = true;
    }
  };

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (originalTextArea) originalTextArea.onwheel(e);
    if (generatedTextArea) generatedTextArea.onwheel(e);
  }, { passive: false });

  onresize = () => {
    let width = innerWidth;
    let height = innerHeight;
    let ratio = devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    c.scale(ratio, ratio);
    isInvalid = true;
  };

  document.body.appendChild(canvas);
  onresize();
  draw();

  let query = matchMedia('(prefers-color-scheme: dark)');
  try {
    query.addEventListener('change', () => isInvalid = true);
  } catch (e) {
    query.addListener(() => isInvalid = true);
  }

  finishLoading(source, sourcemap, url);
}
