'use strict'

const path = require('path')
const distDir = path.resolve(__dirname, 'dist')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './entry.js',
  output: {
    filename: 'bundle.js',
    path: distDir
  },
  devServer: {
    contentBase: distDir,
    port: 60800
  },
  module: {
    rules: [
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
    })
  ]
}