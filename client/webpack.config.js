/* eslint-disable */

const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const MergeIntoSingleFilePlugin = require('webpack-merge-and-include-globally');
const MinifyPlugin = require('babel-minify-webpack-plugin');

const $ = cheerio.load(
  fs.readFileSync(path.resolve(__dirname, 'bin/index.html'))
);
const libFileNames = $('script')
  .get()
  .map(s => `./bin/${s.attribs.src}`)
  .filter(s => s.indexOf('laya.') !== -1 || s.indexOf('bin/libs') !== -1);
const libFiles = libFileNames.map(s => {
  if (s.indexOf('laya.') !== -1) {
    s = s.replace('laya.', 'min/laya.');
    s = s.replace('.js', '.min.js');
  }
  return s;
});
console.log('lib files', libFiles);
const gameFiles = $('script')
  .get()
  .map(s => `./bin/${s.attribs.src}`)
  .filter(s => libFileNames.indexOf(s) === -1 && s.indexOf('wx.js') === -1);
console.log('game files', gameFiles);

const codes = gameFiles.map(name => fs.readFileSync(name, 'utf8'));
let mainCode = '';
codes.forEach(code => {
  mainCode += code;
  mainCode += '\n';
});

const mainFileName = path.resolve(__dirname, 'release/dist/main.min.js');
fs.writeFileSync(mainFileName, mainCode);

const minify = new MinifyPlugin(
  {
    mangle: {
      safari10: true,
    },
  },
  {}
);
const minifyRmConsole = new MinifyPlugin(
  {
    mangle: {
      safari10: true,
    },
    removeConsole: true,
  },
  {}
);
module.exports = {
  entry: {
    main: mainFileName,
  },
  output: {
    filename: '[name].min.js',
    path: path.resolve(__dirname, 'release/dist'),
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        use: 'babel-loader',
      },
    ],
  },
  plugins: [
    new MergeIntoSingleFilePlugin({
      files: {
        'vendor.min.js': libFiles,
      },
    }),
    // minifyRmConsole,
    minify,
  ],
};
