const browserify = require("browserify");
const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const browserSync = require("browser-sync");

/* pathConfig*/
const entryPoint = "./src/js/rotisserie.js";
const sassWatchPath = "./src/scss/*.scss";
const jsWatchPath = "./src/js/*.js";
const htmlWatchPath = "./views/*.html";
/**/

gulp.task("js", () => {
  return browserify(entryPoint, {debug: true, extensions: ["es6"]})
    .transform("babelify", {presets: ["es2015"]})
    .bundle()
    .pipe(source("rotisserie.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("./public/js/"))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task("browser-sync", () => {
  // Browser sync config
  browserSync({
    proxy: "localhost:3000",
  });
});

gulp.task("sass", () => {
  return gulp.src(sassWatchPath)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer({
      browsers: ["last 2 versions"],
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("./public/css/"))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task("watch", () => {
  gulp.watch(jsWatchPath, ["js"]);
  gulp.watch(sassWatchPath, ["sass"]);
  gulp.watch(htmlWatchPath, function() {
    return gulp.src("")
      .pipe(browserSync.reload({stream: true}));
  });
});

gulp.task("build", ["js", "sass"]);

gulp.task("default", ["js", "sass", "watch", "browser-sync"]);
