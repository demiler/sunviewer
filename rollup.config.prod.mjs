import { nodeResolve } from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import postcss from 'rollup-plugin-postcss';
import postcssLit from 'rollup-plugin-postcss-lit';
import { terser } from 'rollup-plugin-terser';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import svg from 'rollup-plugin-svg'

export default {
  input: 'frontend/index.mjs',
  output: {
    file: 'prod/js/index.js',
    format: 'es'
  },
  plugins: [
    svg(),
    postcss({
      inject: false,
    }),
    postcssLit({
      importPackage: 'lit',
    }),
    nodeResolve({
      browser: true,
    }),
    minifyHTML.default({
      options: {
        minifyOptions: {
          conservativeCollapse: true,
          minifyCSS: false, // broken for template strings
          minifyJS: false,
        }
      }
    }),
    terser()
  ]
};
