const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const config = {
  watch: false,
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['env', { modules: false }]]
          }
        }
      }
    ]
  },
  plugins: []
}

// 线上环境js压缩，去除congsole
if (process.env.NODE_ENV === 'production') {
  config.plugins.push(new UglifyJsPlugin({
    uglifyOptions: {
      compress: {
        drop_console: true
      }
    }
  }))
}

module.exports = config