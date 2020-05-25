const path = require('path');
const ROOT = path.resolve(__dirname, 'src');
const DESTINATION = path.resolve(__dirname, 'dist');
const UnminifiedWebpackPlugin = require('unminified-webpack-plugin');

module.exports = {
	context: ROOT,

	entry: {
		main: ROOT + '/main.ts'
	},

	output: {
		filename: 'koji-editor.min.js',
		path: DESTINATION,
		library: 'KojiEditor',
		libraryTarget: 'umd'
	},
	plugins: [ new UnminifiedWebpackPlugin() ],
	resolve: {
		extensions: [ '.ts', '.js' ],
		modules: [ ROOT, 'node_modules' ]
	},

	module: {
		rules: [
			/****************
       * PRE-LOADERS
       *****************/
			// {
			// 	enforce: 'pre',
			// 	test: /\.js$/,
			// 	use: 'source-map-loader',
			// 	exclude: [ path.join(process.cwd(), 'node_modules') ]
			// },
			// {
			//   test: /\.worker\.ts$/,
			//   loader: 'worker-loader',
			//   options: { inline: true }
			// },
			{
				test: /\.ts$/,
				exclude: [ /node_modules/ ],
				use: 'awesome-typescript-loader'
			},
			{
				test: /\.scss$/,
				use: [
					'style-loader', // creates style nodes from JS strings
					'css-loader', // translates CSS into CommonJS
					'sass-loader' // compiles Sass to CSS, using Node Sass by default
				]
			}
		]
	},

	//devtool: 'inline-source-map',
	devServer: {}
};
