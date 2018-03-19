const path          = require('path')
const fs            = require('fs')
const gulp          = require('gulp')
const gulpif        = require('gulp-if')
const named         = require('vinyl-named')
const clean         = require('gulp-clean')
//============= 样式 ================
const sass          = require('gulp-sass')
const postcss       = require('gulp-postcss')
const autoprefixer  = require('autoprefixer')
const base64        = require('gulp-base64')
//============= js =================
const webpack       = require('webpack-stream')
//============= 图片 ================
const imagemin      = require('gulp-imagemin')
// ============= 调试 ===============
const changed       = require('gulp-changed')
const debug         = require('gulp-debug')
//============= 错误处理 =============
const plumber       = require('gulp-plumber')

const webpackConfig = require('./webpack.config.js')
const autoAddHash   = require('./auto')

const comdition = process.env.NODE_ENV === 'production'

const input     = {
  styles:         ['src/**/**/*.scss', '!src/**/_*.scss'],
  js:             ['src/**/*.js', '!src/**/components/*.js'],
  images:         ['src/**/**/images/*']
}
const output    = 'statics'
const filepath  = './build.lst'
let changeList  = []

if (fs.existsSync(filepath)) {
  changeList = fs.readFileSync('./build.lst', 'utf-8').split('\r\n')
}

gulp.task('styles', () => {
  const plugins = [autoprefixer({
      browsers: ['last 2 versions', 'Android >= 4.0', 'IE >= 9'],
      cascade: true,
      remove: true
    })]

  gulp
    .src(input.styles)
    .pipe(gulpif(!comdition, changed(output, { extension: '.css' })))
    .pipe(debug({ title: '编译：' }))
    .pipe(plumber())
    .pipe(sass({
        outputStyle: comdition ? 'compressed' : 'nested'
      }).on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(base64({ exclude: ['.eot', '.woff', '.ttf', '.svg'] }))
    .pipe(named(file => {
      if (!comdition && !changeList.includes(file.relative)) {
        changeList.push(file.relative)
        fs.appendFileSync('build.lst', file.relative + '\r\n')
      }
      return file.relative.slice(0, -path.extname(file.relative).length)
    }))
    .pipe(gulp.dest(output))
})

gulp.task('js', () => {
  gulp
    .src(input.js)
    .pipe(gulpif(!comdition, changed(output, { extension: '.js' })))
    .pipe(debug({ title: '编译：' }))
    .pipe(plumber())
    // 详见： https://github.com/gulpjs/vinyl#filerelative
    .pipe(named(file => {
      if (!comdition && !changeList.includes(file.relative)) {
        changeList.push(file.relative)
        fs.appendFileSync('build.lst', file.relative + '\r\n')
      }

      return file.relative.slice(0, -path.extname(file.relative).length)
    }))
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest(output))
})

gulp.task('images', () => {
  gulp
    .src(input.images)
    .pipe(plumber())
    .pipe(imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }]
        })
      ]))
    .pipe(gulp.dest(output))
})

gulp.task('clean', () => {
  gulp
    .src(output, {read: false})
    .pipe(clean())
})

gulp.task('dev', ['js', 'styles', 'images'], () => {
  gulp.watch(input.styles, ['styles'])
  gulp.watch(input.js, ['js'])
  gulp.watch(input.images, ['images'])
})

gulp.task('build', ['js', 'styles', 'images'], autoAddHash)


gulp.task('default', comdition ? ['build'] : ['dev'])
