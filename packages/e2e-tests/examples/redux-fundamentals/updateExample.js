const path = require('path')
const fse = require('fs-extra')
const { spawnSync } = require('child_process')

const currentFolder = __dirname
const repoRoot = path.join(currentFolder, '../../../../')
const publicExamplesFolder = path.normalize(
  path.join(repoRoot, 'public/test/examples')
)
const buildFolder = path.join(currentFolder, 'dist')
const staticJsFolder = path.join(buildFolder, 'assets')

const exampleDist = path.join(publicExamplesFolder, 'redux-fundamentals/dist')

console.log('Copying build output to: ', exampleDist)

fse.mkdirpSync(exampleDist)
fse.emptyDirSync(exampleDist)
fse.copySync(buildFolder, exampleDist)

console.log('Uploading sourcemaps...')

spawnSync(
  'yarn',
  [
    'replay',
    'upload-sourcemaps',
    //'--dry-run',
    '--group',
    'e2e-test',
    '--api-key',
    'rwk_7o3q05qOwAXoYHWiVLra5cuOilLIghqDRMWyd8ObPac',
    staticJsFolder,
  ],
  { stdio: 'inherit', cwd: currentFolder }
)
