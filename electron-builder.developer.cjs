const packageJson = require('./package.json');

const production = packageJson.build;

module.exports = {
  ...production,
  appId: 'com.blackline.survivor.dev',
  productName: 'Blackline Survivor Dev',
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  electronDist: 'node_modules/electron/dist',
  directories: {
    ...production.directories,
    output: 'release-developer',
  },
  files: [
    'dist-developer/**/*',
    'electron/**/*',
    '!electron/*.test.cjs',
    'package.json',
  ],
  extraMetadata: {
    main: 'electron/main.developer.cjs',
    name: 'blackline-survivor-dev',
    productName: 'Blackline Survivor Dev',
  },
  mac: {
    ...production.mac,
    icon: 'build/icon.icns',
    identity: null,
    notarize: false,
    target: [
      {
        target: 'dir',
        arch: ['arm64'],
      },
    ],
  },
};
