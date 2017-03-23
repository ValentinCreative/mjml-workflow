import gulp from 'gulp'
import path from 'path'
import autoprefixer from 'autoprefixer'
import csso from 'postcss-csso'
import groupMediaQueries from 'gulp-group-css-media-queries'
import handlebars from 'gulp-compile-handlebars'
import mjml from 'gulp-mjml'
import mjmlEngine from 'mjml'
import postcss from 'gulp-postcss'
import smoosher from 'gulp-smoosher'
import sequence from 'gulp-sequence'
import inlineCss from 'gulp-inline-css'
import mjmlDictionnary from './mjml-dictionnary'
import replace from 'gulp-replace'

const browserSync = require('browser-sync').create()
const project     = path.join(`${__dirname}/`)
const ignore      = path.join(`!${project}`)

const paths = {
    tmp : {
        root : `${project}tmp/`,
        mjml : `${project}tmp/**/*.mjml`,
    },
    src : {
        root        : `${project}src/`,
        emails      : `${project}src/emails/`,
        partials    : `${project}src/partials/`,
        stylesheets : `${project}src/css/`,
        css         : `${project}src/css/*.css`,
        mjml        : `${project}src/emails/**/*.mjml`,
        all         : `${project}src/**/*.{hbs,mjml,css}`,
    },
    dist : {
        root : `${project}dist/`,
        all  : `${project}dist/**/*.html`,
    },
}

const options = {

    handlebars : {
        batch : [paths.src.partials],
    },

    autoprefixer : {
        browsers : ['last 3 versions'],
        cascade  : false,
    },

    inlineCss : {
        applyWidthAttributes : true,
        preserveMediaQueries : true,
        removeStyleTags      : true,
        applyAttributesTo    : mjmlDictionnary,
    },
}

const data = {

}

const postcssPlugins = [
    autoprefixer(options.autoprefixer),
    csso,
]

gulp.task('assemble', () => {
    return gulp.src(paths.src.mjml)
        .pipe(handlebars(data, options.handlebars))
        .pipe(gulp.dest(paths.tmp))
})

gulp.task('mjml', () => {
    return gulp.src(paths.tmp.mjml)
        .pipe(mjml(mjmlEngine))
        .pipe(gulp.dest(paths.dist.root))
        .pipe(browserSync.stream())
})

gulp.task('css', () => {
    return gulp.src(paths.src.css)
        .pipe(postcss(postcssPlugins))
        .pipe(groupMediaQueries())
        .pipe(gulp.dest(paths.tmp.root))
})

gulp.task('inline-css', () => {
    return gulp.src(paths.tmp.mjml)
        .pipe(smoosher())
        .pipe(inlineCss(options.inlineCss))
        .pipe(replace('style>', 'mj-style>'))
        .pipe(gulp.dest(paths.tmp.root))
})

gulp.task('sequence', callback => {
    sequence('assemble', 'css', 'inline-css', 'mjml')(callback)
})

gulp.task('default', ['sequence'])

gulp.task('watch', () => {
    gulp.watch(paths.src.all, ['sequence'])
    gulp.watch(paths.dist.all).on('change', browserSync.reload)
    browserSync.init({
        'server': paths.dist.root,
    });
})

