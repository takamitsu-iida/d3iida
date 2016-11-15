module.exports = function (grunt) {
  var pkg = grunt.file.readJSON('package.json');

  grunt.file.defaultEncoding = 'utf-8';
  grunt.file.preserveBOM = true;

  grunt.initConfig({
    concat: {
      target_js: {
        // 元ファイルの指定
        src: [
          'static/site/js/d3iida.startup.js',
          'static/site/js/d3iida.datamanager.js',
          'static/site/js/d3iida.barChart.js',
          'static/site/js/d3iida.lineChart.js',
          'static/site/js/d3iida.multiLineChart.js',
          'static/site/js/d3iida.pieChart.js',
          'static/site/js/d3iida.radioButton.js',
          'static/site/js/d3iida.simpleTable.js',
          'static/site/js/d3iida.slider.js',
          'static/site/js/d3iida.vhover.js',
          'static/site/js/d3iida.vhover2.js',
          'static/site/js/d3iida.sliderChart.js',
          'static/site/js/d3iida.tweenChart.js',
          'static/site/js/d3iida.tooltip.js',
          'static/site/js/d3iida.mapChart.js',
          'static/site/js/d3iida.populationMap.js',
          'static/site/js/d3iida.geodata.japan.js',
          'static/site/js/d3iida.geodata.prefectures.js'
          ],
        // 出力ファイルの指定
        dest: 'static/site/dist/d3iida.js'
      },
      target_css: {
        src: [
          'static/site/css/d3iida.css',
          'static/site/css/d3iida.japan.css',
          'static/site/css/d3iida.slider.css',
          'static/site/css/d3iida.vhover.css'
          ],
        dest: 'static/site/dist/d3iida.css'
      }
    },

    uglify: {
      target_js: {
        files: {
          // 出力ファイル: 元ファイル
          'static/site/dist/d3iida-min.js': ['static/site/dist/d3iida.js']
        }
      }
    }
  });

  // プラグインのロード・デフォルトタスクの登録
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('default', ['concat', 'uglify']);
};
