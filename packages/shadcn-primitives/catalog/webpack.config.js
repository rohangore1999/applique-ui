/* eslint-disable node/no-unpublished-require */

const Path = require('path')
const Autoprefixer = require('autoprefixer')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const Tailwindcss = require('tailwindcss')

const packageDir = Path.resolve(__dirname, '..')
const outputDir = Path.resolve(packageDir, '../../docs/catalog')
const tailwindConfig = require('../tailwind.config')

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
                    ...tailwindConfig,
                    content: [
                      Path.resolve(packageDir, 'src/**/*.{ts,tsx}'),
                      Path.resolve(__dirname, '**/*.{ts,tsx}'),
                    ],
                  }),
                  Autoprefixer(),
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
