const path = require('path');

module.exports = {
  entry: './index.web.js',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['react-native-web/babel']
          }
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'images/'
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web'
    },
    extensions: ['.web.js', '.js', '.jsx', '.json']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  devServer: {
    static: path.join(__dirname, 'public'),
    port: 3000,
    historyApiFallback: true
  }
};