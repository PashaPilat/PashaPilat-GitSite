const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
    const isProd = argv.mode === "production";

    console.log("Webpack mode:", argv.mode);

    return {
        entry: "./src/index.js",

        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "bundle.js",
            clean: true,
            publicPath: isProd ? "/PashaPilat-GitSite/" : "/"
        },

        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-env",
                                "@babel/preset-react"
                            ],
                            sourceType: "unambiguous"
                        }
                    }
                },

                {
                    test: /\.scss$/,
                    use: [
                        "style-loader",
                        "css-loader",
                        "sass-loader"
                    ]
                },

                {
                    test: /\.css$/,
                    use: [
                        "style-loader",
                        "css-loader"
                    ]
                },

                {
                    test: /\.(png|jpe?g|gif|webp)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "images/[hash][ext][query]"
                    }
                },

                {
                    test: /\.ico$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "favicon[ext]"
                    }
                },

                {
                    test: /\.(woff|woff2|eot|ttf|svg)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "fonts/[hash][ext][query]"
                    }
                }
            ]
        },

        devServer: {
            static: {
                directory: path.join(__dirname, "public")
            },
            historyApiFallback: true,
            port: 3000,
            open: true
        },

        resolve: {
            extensions: [".js", ".jsx"]
        },

        plugins: [
            new HtmlWebpackPlugin({
                template: "./public/index.html",
                filename: "index.html",
                favicon: "./src/assets/icons/favicon.ico",
                inject: "body"
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: "public/404.html",
                        to: "404.html"
                    }
                ]
            })
        ]
    };
};