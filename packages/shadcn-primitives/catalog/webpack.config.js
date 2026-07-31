/* eslint-disable node/no-unpublished-require */

const Fs = require('fs')
const Path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const Tailwindcss = require('@tailwindcss/postcss')

const packageDir = Path.resolve(__dirname, '..')
const outputDir = Path.resolve(packageDir, '../../docs/catalog')
const compatAliases = [
  ['next/image$', Path.resolve(__dirname, 'compat/next-image.tsx')],
  ['next/link$', Path.resolve(__dirname, 'compat/next-link.tsx')],
].reduce((aliases, [request, target]) => {
  if (Fs.existsSync(target)) {
    aliases[request] = target
  }

  return aliases
}, {})

module.exports = {
  mode: 'production',
  context: __dirname,
  entry: './index.tsx',
  output: {
    clean: true,
    filename: 'catalog.js',
    path: outputDir,
    publicPath: './',
  },
  resolve: {
    alias: compatAliases,
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve('ts-loader'),
          options: {
            configFile: Path.resolve(packageDir, '../../tsconfig.json'),
            compilerOptions: {
              jsx: 'react-jsx',
            },
            transpileOnly: true,
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          require.resolve('style-loader'),
          {
            loader: require.resolve('css-loader'),
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: require.resolve('postcss-loader'),
            options: {
              postcssOptions: {
                config: false,
                plugins: [
                  Tailwindcss({
                    base: packageDir,
                  }),
                ],
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ],
  performance: {
    hints: false,
  },
}
