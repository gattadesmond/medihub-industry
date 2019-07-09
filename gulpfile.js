//Styles
const sassCSS = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const cleanCSS = require("gulp-clean-css");

//Javascript
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");


//Get path name
const path = require('path');

//BrowserSync
const browserSync = require("browser-sync");

//Gulp
const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const gulpif = require("gulp-if");
const plumber = require("gulp-plumber");

const runSequence = require("run-sequence");
const data = require("gulp-data");
const del = require('del');
//ImageMin
const imagemin = require("gulp-imagemin");

//SVG
const rename = require('gulp-rename');
const svgstore = require('gulp-svgstore');

//Concat
const concat = require("gulp-concat");


//Un CSS
const purgecss = require('gulp-purgecss');
//Inline
const inlineSource = require('gulp-inline-source');


//Critical CSS
const critical = require('critical').stream;;



//Yargs
const yargs = require("yargs");
const yaml = require("js-yaml");
const fs = require("fs");

//Nunjucks
const nunjucksRender = require("gulp-nunjucks-render");

// Check for --build flag
const PRODUCTION = !!yargs.argv.production;

const CRITICAL = !!yargs.argv.critical;

// Load settings from settings.yml
const {
    COMPATIBILITY,
    PORT,
    UNCSS_OPTIONS,
    PATHS
} = loadConfig();

if (PRODUCTION) {
    PATHS.dist = "public";
}

function loadConfig() {
    let ymlFile = fs.readFileSync("config.yml", "utf8");
    return yaml.load(ymlFile);
}


// Delete the "dist" folder
// This happens every time a build starts

gulp.task("clean", done => del([PATHS.dist + '/**']));

// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately

gulp.task("copy", () => gulp.src(PATHS.assets).pipe(gulp.dest(PATHS.dist)));


gulp.task("server", function (done) {
    browserSync.init({
        server: PATHS.dist,
        port: PORT
    });
    done();
});


gulp.task("reload", function (done) {
    browserSync.reload();
    done();
});




function getDataForFile(file) {
    // return JSON.parse(fs.readFileSync(PATHS.data , "utf8"))
    // return JSON.parse(fs.readFileSync('src/html/data/global.json'));
    const data = JSON.parse(fs.readFileSync(PATHS.data.toString(), 'utf8'));

    data.file = file;
    data.filename = path.basename(file.path);

    data.isActiveMenuItem = function (file, item, filename) {
        if (file === filename || (item.sub && item.sub[filename])) {
            return true;
        }

        if (item.sub) {
            for (const fileSub in item.sub) {
                const itemSub = item.sub[fileSub];

                if (fileSub === filename || (itemSub.sub && itemSub.sub[filename])) {
                    return true;
                }
            }
        }

        return false;
    };

    return data;

}


var manageEnvironment = function (environment) {
    environment.addFilter('is_active', function (str, reg, page) {
        reg = new RegExp(reg, 'gm');
        reg = reg.exec(page);
        if (reg != null) {
            return str;
        }
    });

    environment.addFilter('slug', function (str) {
        return str && str.replace(/\s/g, '-', str).toLowerCase();
    });

    environment.addGlobal('globalTitle', 'Gulp Desmond')
    if (PRODUCTION) {
        environment.addGlobal('inlineSource', true)
    }
    if (CRITICAL) {
        environment.addGlobal('critical', true)
    }

}

//HTML tasks
gulp.task("html", () =>
    gulp
    .src("src/html/*.html")
    .pipe(
        plumber()
    )
    .pipe(data(getDataForFile))
    .pipe(
        nunjucksRender({
            path: "src/html/",
            envOptions: {
                watch: false,
                trimBlocks: true,
                lstripBlocks: true
            },
            manageEnv: manageEnvironment

        })
    )
    .pipe(gulp.dest(PATHS.dist))
);

//SVG
gulp.task('svgstore', function () {
    return gulp
        .src('src/svg/**/*.svg', {
            base: 'src/svg'
        })
        .pipe(rename({
            prefix: 'svg-'
        }))
        .pipe(svgstore())
        .pipe(gulp.dest(PATHS.dist + "/svg/"));
});


//SASS tasks
gulp.task("sass", () =>
    gulp
    .src("src/stylesheets/**/*.scss")
    .pipe(sourcemaps.init())
    .pipe(
        sassCSS({
            includePaths: PATHS.sass
        }).on("error", sassCSS.logError)
    )
    .pipe(
        autoprefixer({
            browsers: COMPATIBILITY
        })
    )

    .pipe(
        gulpif(
            PRODUCTION,
            cleanCSS({
                compatibility: "ie9",
                level: {
                    1: {
                        specialComments: 0
                    }
                }
            })
        )
    )

    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))

    .pipe(gulp.dest(PATHS.dist + "/stylesheets/"))

    .pipe(browserSync.reload({
        stream: true
    }))
);


//JAVASCRIPT Tasks
gulp.task("javascript", () =>
    gulp
    .src(PATHS.javascript)

    .pipe(
        plumber()
    )

    .pipe(
        gulpif(
            PRODUCTION,

            babel({
                presets: [
                    [
                        "latest",
                        {
                            es2015: {
                                modules: false
                            }
                        }
                    ]
                ]
            })
        )
    )

    .pipe(concat("app.js"))

    .pipe(gulpif(PRODUCTION, uglify()))

    .pipe(gulp.dest(PATHS.dist + "/javascripts/"))
);


//IMAGES Tasks
// Copy images to the "dist" folder
// In production, the images are compressed
gulp.task("images", () =>
    gulp
    .src("src/images/**/*")
    .pipe(
        gulpif(
            PRODUCTION,
            imagemin({
                progressive: true
            })
        )
    )
    .pipe(gulp.dest(PATHS.dist + "/images"))
)



//Remove unuse CSS

gulp.task('purgecss', () => {
    return gulp
        .src(PATHS.dist + '/stylesheets/**/*.css')
        .pipe(
            purgecss({
                content: [PATHS.dist + '/**/*.html']
            })
        )
        .pipe(gulp.dest(PATHS.dist + '/inline/'))
})


//Inline source
gulp.task('inlineSource', function () {
    return gulp.src(PATHS.dist + '/*.html')
        .pipe(inlineSource())
        .pipe(gulp.dest(PATHS.dist))
});

//Critical CSS
gulp.task("criticalClean", done => del(['critical/**']));

gulp.task("criticalCopy", () => gulp.src("public/**").pipe(gulp.dest("critical")));


// Generate & Inline Critical-path CSS
gulp.task('criticalCSS', function () {
    return gulp
        .src('critical/*.html')
        .pipe(critical({
            base: 'critical/',
            inline: true,
            minify: true,
            dimensions: [{
                height: 200,
                width: 500
            }, {
                height: 900,
                width: 1200
            }],
            ignore: ['@font-face',/url\(/],
            css: ['critical/stylesheets/core.css'],
        }))
        .on('error', function (err) {
            log.error(err.message);
        })
        .pipe(gulp.dest('critical/'));
});



gulp.task("watch", function () {

    gulp.watch(PATHS.assets, ["copy"]);

    gulp.watch(
        "src/html/**/*.html",
        function () {
            runSequence("html", "reload")
        }
    );

    gulp.watch(
        "src/javascripts/**/*.js",
        function () {
            runSequence("javascript", "reload")
        }
    );

    gulp.watch("src/stylesheets/**/*.scss", ["sass"]);
    gulp.watch(
        "src/images/**/*",
        function () {
            runSequence("images", "reload")
        }
    );
});

gulp.task("critical", function () {
    runSequence(
        "criticalClean","criticalCopy", "criticalCSS"
    );
});


gulp.task("build", function () {
    runSequence(
        "clean", ["html", "sass", "javascript", "images"],
        "copy", "svgstore"
    );
});


// gulp.task("default", gulp.series("build", server, watch));

gulp.task("default", function () {
    runSequence(
        "clean", ["html", "sass", "javascript", "images"],
        "copy", "svgstore",
        "server", "watch"
    );
});