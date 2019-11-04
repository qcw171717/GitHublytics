const gulp        = require('gulp');
const browserSync = require('browser-sync').create();
const sass        = require('gulp-sass');

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src(['node_modules/bootstrap/scss/bootstrap.scss', 'public/assets/scss/*.scss'])
        .pipe(sass())
        .pipe(gulp.dest("public/assets/css"))
        .pipe(browserSync.stream());
});

// Move the javascript files into our public/assets/js folder
gulp.task('js', function() {
    return gulp.src(['node_modules/bootstrap/dist/js/bootstrap.min.js', 'node_modules/jquery/dist/jquery.min.js', 'node_modules/popper.js/dist/umd/popper.min.js'])
        .pipe(gulp.dest("public/assets/js"))
        .pipe(browserSync.stream());
});

// Static Server + watching scss/html files
gulp.task('serve', gulp.parallel('sass', function() {

    browserSync.init({
        server: "./public"  
    });

    gulp.watch(['node_modules/bootstrap/scss/bootstrap.scss', 'public/assets/scss/*.scss'], gulp.parallel('sass'));
    gulp.watch("public/*.html").on('change', browserSync.reload);
}));

gulp.task('default', gulp.parallel('js','serve'));