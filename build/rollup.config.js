const { resolve } = require('path')
const rollupBabel = require('rollup-plugin-babel')
const rollupAlias = require('rollup-plugin-alias')
const rollupCommonJS = require('rollup-plugin-commonjs')
const rollupReplace = require('rollup-plugin-replace')
const rollupNodeResolve = require('rollup-plugin-node-resolve')
const packageJson = require('../package.json')

const dependencies = Object.keys(packageJson.dependencies)
const version = packageJson.version || process.env.VERSION

/* banner */
const banner =
    '/*!\n' +
    ' * Vuxtra.js v' + version + '\n' +
    ' * (c) 2017-' + new Date().getFullYear() + ' Faruk Brbovic\n' +
    ' * Released under the MIT License.\n' +
    ' */'

/* Aliases */
const rootDir = resolve(__dirname, '..')
const libDir = resolve(rootDir, 'lib')
const distDir = resolve(rootDir, 'dist')

const aliases = {
}

/* Builds */
const builds = {
    nuxtVuxtraControlleres: {
        entry: resolve(libDir, 'vuxtraController.js'),
        file: resolve(distDir, 'vuxtraController.es.js'),
        format: 'es'
    },
    nuxtVuxtraController: {
        entry: resolve(libDir, 'vuxtraController.js'),
        file: resolve(distDir, 'vuxtraController.js')
    },
    // nuxtModuleVuxtra: {
    //     entry: resolve(libDir, 'nuxt/modules/vuxtra/index.js'),
    //     file: resolve(distDir, 'nuxt/modules/vuxtra/index.js')
    // },
    // nuxtPluginVuxtra: {
    //     entry: resolve(libDir, 'nuxt/modules/vuxtra/plugin.js'),
    //     file: resolve(distDir, 'nuxt/modules/vuxtra/Plugin.js'),
    // },
}

/* Config */
function genConfig (opts) {
    const config = {
        input: opts.entry,
        output: {
            file: opts.file,
            format: opts.format || 'cjs',
            sourcemap: true
        },
        external: ['fs', 'path', 'http']
            .concat(dependencies, opts.external),
        banner: opts.banner || banner,
        name: opts.modulename || 'Vuxtra',
        plugins: [
            rollupAlias(Object.assign({
                resolve: ['.js', '.json', '.jsx', '.ts']
            }, aliases, opts.alias)),

            rollupNodeResolve({ preferBuiltins: true }),

            rollupCommonJS(),

            rollupBabel(Object.assign({
                exclude: 'node_modules/**',
                plugins: [
                    ['transform-runtime', { 'helpers': false, 'polyfill': false }],
                    'transform-async-to-generator',
                    'array-includes',
                    'external-helpers'
                ],
                presets: [
                    ['env', {
                        targets: {
                            node: '8.7.0'
                        },
                        modules: false
                    }]
                ],
                'env': {
                    'test': {
                        'plugins': [ 'istanbul' ]
                    }
                }
            }, opts.babel)),

            rollupReplace({ __VERSION__: version })
        ].concat(opts.plugins || [])
    }

    if (opts.env) {
        config.plugins.push(rollupReplace({
            'process.env.NODE_ENV': JSON.stringify(opts.env)
        }))
    }

    return config
}

if (process.env.TARGET) {
    module.exports = genConfig(builds[process.env.TARGET])
} else {
    module.exports = Object.keys(builds).map(name => genConfig(builds[name]))
}