// https://softwarerecs.stackexchange.com/questions/38274/module-bundler-for-typescript-in-greasemonkey
// required for path resolution for dist folder
const path = require('path');
// used to access the BannerPlugin
const webpack = require('webpack');
// required for pretty format for the Userscript banner
const stripIndent = require('common-tags').stripIndent;

module.exports = {
    entry: './src/main.ts',
    devtool: 'inline-source-map',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'stream-nexus.user.js'
    },
    plugins: [
        new webpack.BannerPlugin({
            raw: true,
            banner: stripIndent`
            // ==UserScript==
            // @name         Test UserScript from TypeScript w/webpack
            // @namespace    http://tampermonkey.net/
            // @version      0.1
            // @description  Unify, and SNEED!
            // @author       Sneed
            // @match        https://www.youtube.com/live_chat*
            // @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
            // @grant        none
            // ==/UserScript==
            `
        })
    ]
};