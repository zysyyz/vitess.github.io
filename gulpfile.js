var gulp = require('gulp');

    //Plugins模块获取
    var minifycss = require('gulp-minify-css');
    var uglify = require('gulp-uglify');
    var htmlmin = require('gulp-htmlmin');
    var htmlclean = require('gulp-htmlclean');

    // 压缩 public 目录 css文件
    gulp.task('minify-css', function() {
        return gulp.src('public/css/*.css')
            .pipe(minifycss())
            .pipe(gulp.dest('public/css'));
    });

    // 压缩 public 目录 html文件
    gulp.task('minify-html', function() {
      return gulp.src('public/**/*.html')
        .pipe(htmlclean())
        .pipe(htmlmin({
             removeComments: true,
             minifyJS: true,
             minifyCSS: true,
             minifyURLs: true,
        }))
        .pipe(gulp.dest('public'))
    });

    // 压缩 public 目录 html文件
    gulp.task('minify-html1', function() {
      return gulp.src('public/**/**/*.html')
        .pipe(htmlclean())
        .pipe(htmlmin({
             removeComments: true,
             minifyJS: true,
             minifyCSS: true,
             minifyURLs: true,
        }))
        .pipe(gulp.dest('public'))
    });


    // 压缩 public 目录 html文件
    gulp.task('minify-html2', function() {
      return gulp.src('public/**/**/**/*.html')
        .pipe(htmlclean())
        .pipe(htmlmin({
             removeComments: true,
             minifyJS: true,
             minifyCSS: true,
             minifyURLs: true,
        }))
        .pipe(gulp.dest('public'))
    });

    // 压缩 public 目录 html文件
    gulp.task('minify-html3', function() {
      return gulp.src('public/*.html')
        .pipe(htmlclean())
        .pipe(htmlmin({
             removeComments: true,
             minifyJS: true,
             minifyCSS: true,
             minifyURLs: true,
        }))
        .pipe(gulp.dest('public'))
    });


    // 压缩 public/js 目录 js文件
    gulp.task('minify-js', function() {
        return gulp.src('public/js/*.js')
            .pipe(uglify())
            .pipe(gulp.dest('public/js'));
    });


    // 执行 gulp 命令时执行的任务
    gulp.task('default', [
        'minify-html','minify-html1','minify-html2','minify-html3','minify-css','minify-js'
    ]);
