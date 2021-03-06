import gulp from 'gulp'
import path from 'path'
import csso from 'postcss-csso'
import groupMediaQueries from 'gulp-group-css-media-queries'
import handlebars from 'gulp-compile-handlebars'
import mjml from 'gulp-mjml'
import mjmlEngine from 'mjml'
import postcss from 'gulp-postcss'
import smoosher from 'gulp-smoosher'
import sequence from 'gulp-sequence'
import rsync from 'gulp-rsync'
import newer from 'gulp-newer'
import clean from 'gulp-clean'
import inlineCss from 'gulp-inline-css'
import mjmlDictionnary from './mjml-dictionnary'
import replace from 'gulp-replace'
import imagemin from 'gulp-imagemin'
import imageminGuetzli from 'imagemin-guetzli'
import svg2png from 'gulp-svg2png'
import svgmin from 'gulp-svgmin'
import svgScaler from 'svg-scaler'
import addSvgSize from './addSvgSize'
import deployConfig from './deploy.config'
import cssNesting from 'postcss-nested'
import cssNext from 'postcss-cssnext'

const browserSync = require('browser-sync').create()
const project     = path.join(`${__dirname}/`)
const ignore      = path.join(`!${project}`)

const paths = {
    tmp : {
        root : `${project}tmp/`,
        all  : `${project}tmp/**/*`,
        mjml : `${project}tmp/**/*.mjml`,
    },
    src : {
        root        : `${project}src/`,
        emails      : {
            root : `${project}src/emails/`,
            mjml : `${project}src/emails/**/*.mjml`,
        },
        partials    : {
            root : `${project}src/partials/`,
            hbs  : `${project}src/partials/**/*.hbs`,
        },
        stylesheets : {
            root : `${project}src/css/`,
            css : `${project}src/css/*.css`,
        },
        images      : {
            root : `${project}src/images/`,
            all  : `${project}src/images/**/*`,
            png  : `${project}src/images/**/*.png`,
            jpg  : `${project}src/images/**/*.jpg`,
            svg  : `${project}src/images/**/*.svg`,
        },
    },
    dist : {
        root   : `${project}dist/`,
        images : {
            root : `${project}dist/images/`,
            all  : `${project}dist/images/**/*`,
        },
        html   : `${project}dist/**/*.html`,
    },
}

const options = {

    handlebars : {
        batch : [paths.src.partials.root],
    },

    cssNext : {
        browsers : ['last 3 versions'],
    },

    inlineCss : {
        applyWidthAttributes : true,
        preserveMediaQueries : true,
        removeStyleTags      : true,
        applyAttributesTo    : mjmlDictionnary,
    },

    browserSync : {
        open   : false,
        server : {
            baseDir   : paths.dist.root,
            directory : true,
        },
    },

    rsync : {
        ...deployConfig,
        root        : paths.dist.images.root,
        archive     : true,
        silent      : false,
        compress    : true,
    }
}

const data = {
    imagesPath : deployConfig.imagesPath,
}

const postcssPlugins = [
    cssNesting,
    cssNext(options.cssNext),
    csso,
]

gulp.task('assemble', () => {
    return gulp.src(paths.src.emails.mjml)
        .pipe(handlebars(data, options.handlebars))
        .pipe(gulp.dest(paths.tmp.root))
})

gulp.task('mjml', () => {
    return gulp.src(paths.tmp.mjml)
        .pipe(mjml(mjmlEngine))
        .pipe(gulp.dest(paths.dist.root))
        .pipe(browserSync.stream())
})

gulp.task('css', () => {
    return gulp.src(paths.src.stylesheets.css)
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

gulp.task('png', () => {
    return gulp.src(paths.src.images.png)
        .pipe(newer(paths.dist.images.root))
        .pipe(imagemin([imagemin.optipng()]))
        .pipe(gulp.dest(paths.dist.images.root))
})

gulp.task('jpg', () => {
    return gulp.src(paths.src.images.jpg)
        .pipe(newer(paths.dist.images.root))
        .pipe(imagemin([imageminGuetzli()]))
        .pipe(gulp.dest(paths.dist.images.root))
})

gulp.task('svg', () => {
    return gulp.src(paths.src.images.svg)
        .pipe(newer(paths.dist.images.root))
        .pipe(addSvgSize())
        .pipe(svg2png())
        .pipe(imagemin([imagemin.optipng()]))
        .pipe(gulp.dest(paths.dist.images.root))
})

gulp.task('images', ['png', 'jpg', 'svg'])

gulp.task('clean', () => {
    return gulp.src([paths.tmp.all, paths.dist.html], {read : false})
        .pipe(clean())
})

gulp.task('clean-images', () => {
    return gulp.src(paths.dist.images.all, {read : false})
        .pipe(clean())
})

gulp.task('deploy-images', () => {
    gulp.src(paths.dist.images.all)
        .pipe(rsync(options.rsync))
})

gulp.task('sequence', callback => {
    sequence('assemble', 'css', 'inline-css', 'mjml')(callback)
})

gulp.task('default', callback => {
    sequence('clean', 'sequence', 'images', 'deploy-images')(callback)
})

gulp.task('watch', () => {
    gulp.watch([
        paths.src.emails.mjml,
        paths.src.stylesheets.css,
        paths.src.partials.hbs
    ], ['sequence'])
    gulp.watch(paths.src.images.all, ['images'])
    gulp.watch(paths.dist.html).on('change', browserSync.reload)
    browserSync.init(options.browserSync)
})

