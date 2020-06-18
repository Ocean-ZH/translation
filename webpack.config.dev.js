const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackChromeReloaderPlugin = require('webpack-chrome-extension-reloader');

module.exports = {
  mode: 'development',
  entry: {
    main: './src/main.js',
    background: './src/background.js'
  },
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: '[name].js'
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              injectType: 'lazyStyleTag',
              insert: function insertAtTop(element) {
                var parent = document.querySelector('#TX_SH_0001').shadowRoot;
                // eslint-disable-next-line no-underscore-dangle
                var lastInsertedElement =
                  window._lastElementInsertedByStyleLoader;

                if (!lastInsertedElement) {
                  parent.insertBefore(element, parent.firstChild);
                } else if (lastInsertedElement.nextSibling) {
                  parent.insertBefore(element, lastInsertedElement.nextSibling);
                } else {
                  parent.appendChild(element);
                }

                // eslint-disable-next-line no-underscore-dangle
                window._lastElementInsertedByStyleLoader = element;
              }
            }
          },
          'css-loader',
          'sass-loader'
        ],
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, './src/manifest.json'),
        to: path.resolve(__dirname, './out/manifest.json')
      }, {
        from: path.resolve(__dirname, './src/images'),
        to: path.resolve(__dirname, './out'),
        ignore: ['*.gif']
      }, {
        from: path.resolve(__dirname, './src/popup.js'),
        to: path.resolve(__dirname, './out/popup.js')
      }, {
        from: path.resolve(__dirname, './src/page/popup.html'),
        to: path.resolve(__dirname, './out/popup.html')
      }, {
        from: path.resolve(__dirname, './src/traineddata'),
        to: path.resolve(__dirname,'./out/traineddata')
      }, {
        from: path.resolve(__dirname, './src/lib'),
        to: path.resolve(__dirname, './out/lib')
      }
    ]),
    new WebpackChromeReloaderPlugin({
      port: 9091,
      reloadPage: true,
      entries: {
        contentScript: 'main',
        background: 'background'
      }
    }),
  ]
}