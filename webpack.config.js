const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/', // важно для React Router
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                //type: "javascript/auto",
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-react'
                        ],
                        sourceType: "unambiguous"
                    }
                }
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',   // внедряет стили в DOM
                    'css-loader',     // позволяет импортировать CSS/SCSS
                    'sass-loader'     // компиляция SCSS → CSS
                ]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[hash][ext][query]'
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf|svg)$/, // для Font Awesome
                type: 'asset/resource'
            }
        ]
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        historyApiFallback: true, // нужно для React Router
        port: 3000,
        open: true
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: 'index.html'
        })
    ]

   // mode: 'development'
};
