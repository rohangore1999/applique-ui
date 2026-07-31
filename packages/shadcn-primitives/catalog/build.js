/* eslint-disable node/no-unpublished-require */

const webpack = require('webpack')
const config = require('./webpack.config')

webpack(config, (error, stats) => {
  if (error) {
    console.error(error)
    process.exitCode = 1
    return
  }

  const result = stats.toJson({
    all: false,
    assets: true,
    errors: true,
    timings: true,
    warnings: true,
  })

  if (stats.hasErrors()) {
    console.error(
      stats.toString({
        all: false,
        colors: process.stdout.isTTY,
        errors: true,
        errorDetails: true,
      })
    )
    process.exitCode = 1
    return
  }

  if (stats.hasWarnings()) {
    console.warn(
      stats.toString({
        all: false,
        colors: process.stdout.isTTY,
        warnings: true,
      })
    )
  }

  const assets = (result.assets || [])
    .map(({ name, size }) => `${name} (${Math.ceil(size / 1024)} KiB)`)
    .join(', ')

  console.log(`Catalogue built in ${result.time} ms: ${assets}`)
})
