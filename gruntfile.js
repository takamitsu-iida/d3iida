module.exports = function (grunt) {
  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    concat: {
      files: {
        // 元ファイルの指定
        src: [
          'static/site/js/d3iida.js',
          'static/site/js/d3iida.datamanager.js',
          'static/site/js/d3iida.barChart.js',
          'static/site/js/d3iida.lineChart.js',
          'static/site/js/d3iida.multiLineChart.js',
          'static/site/js/d3iida.pieChart.js',
          'static/site/js/d3iida.radioButton.js',
          'static/site/js/d3iida.simpleTable.js',
          'static/site/js/d3iida.mapChart.js',
          'static/site/js/d3iida.geodata.japan.js',
          'static/site/js/d3iida.geodata.prefectures.js'
          ],
        // 出力ファイルの指定
        dest: 'static/site/js/dist/d3iida.js'
      }
    },

    uglify: {
      dist: {
        files: {
          // 出力ファイル: 元ファイル
          'static/site/js/dist/d3iida-min.js': 'static/site/js/dist/d3iida.js'
        }
      }
    }
  });

  // プラグインのロード・デフォルトタスクの登録
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('default', ['concat', 'uglify']);
};
