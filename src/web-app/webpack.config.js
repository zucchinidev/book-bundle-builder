'use strict'

const webpack = require('webpack')
const path = require('path')
const distDir = path.resolve(__dirname, 'dist')
const entry = path.resolve(__dirname, './app/index.ts')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry,
  output: {
    filename: 'bundle.js',
    path: distDir
  },
  devServer: {
    contentBase: distDir,
    port: 60800,
    proxy: {
      '/api': 'http://localhost:8080',
      '/es': {
        target: 'http://localhost:9200',
        pathRewrite: { '^/es': '' }
      }
    }
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        use: 'url-loader?limit=100000'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Book Bundle Builder'
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ]
}