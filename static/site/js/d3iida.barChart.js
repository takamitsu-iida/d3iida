/* global d3, d3iida */

// 2016.11.01
// Takamitsu IIDA
// takamitsu.iida@gmail.com

// 棒グラフモジュール
(function() {
  d3iida.barChart = function module() {
    // SVGの枠の大きさ
    var width = 500;
    var height = 300;

    // 'g'の描画領域となるデフォルトのマージン
    var margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    };

    // d3.jsで描画する領域。軸や凡例がはみ出てしまうので、マージンの分だけ小さくしておく。
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // カスタムイベントを登録する
    var dispatch = d3.dispatch('customHover');

    function exports(_selection) {
      _selection.each(function(_data) {
        // nullをバインドしてcall()されたら、描画済みのsvgを全て削除する
        if (!_data) {
          d3.select(this).select('svg').remove();
          return;
        }

        var barW = w / _data.length;
        var scaling = h / d3.max(_data);

        // ダミーデータを紐付けることでsvgの重複作成を防止する
        var svgAll = d3.select(this).selectAll('svg').data(['dummy']);

        svgAll
          // UPDATE領域
          .attr('width', width)
          .attr('height', height)
          .select('g')
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        svgAll
          // ENTER領域
          .enter()
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .append('g')
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
          .classed('mainLayer', true);

        // svg直下の'g'を取り出す
        var mainLayer = d3.select(this).select('.mainLayer');

        // transitionインスタンス
        var t = d3.transition().ease(d3.easeLinear);

        // 棒グラフを作成
        var bars = mainLayer.selectAll('.bar')
          .data(
            // dは_dataと同じなので、.data(_data)としてもいい
            function(d, i) {
              return d;
            }
          );

        // ENTER領域
        bars.enter()
          .append('rect')
          .classed('bar', true)
          .attr('width', barW)
          .attr('x', w)
          .attr('y', function(d, i) {
            return h - d * scaling;
          })
          .attr('height', function(d, i) {
            return d * scaling;
          })
          .on('mouseover', function(d) {
            // カスタムイベントをディスパッチする
            dispatch.call('customHover', this, d);
          })
          // ENTER + UPDATE領域
          .merge(bars)
          .transition(t)
          .attr('width', barW)
          .attr('x', function(d, i) {
            return i * barW;
          })
          .attr('y', function(d, i) {
            return h - d * scaling;
          })
          .attr('height', function(d, i) {
            return d * scaling;
          });

        bars.exit()
          .transition(t)
          .style('opacity', 0)
          .remove();
        //
      });
    }

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      return this;
    };

    // カスタムイベントを'on'で発火できるようにリバインドする
    // v3までのやり方
    // d3.rebind(exports, dispatch, 'on');
    // v4のやり方
    exports.on = function() {
      var value = dispatch.on.apply(dispatch, arguments);
      return value === dispatch ? exports : value;
    };

    return exports;
  };

  // 使い方  <div id='barChart'></div>内に棒グラフを描画する
  d3iida.barChart.example = function() {
    var data = [10, 20, 30, 40, 50];
    // var data = d3iida.utils.rndNumbers(50, 100);

    var width = 600;
    var height = 400;

    var barChart = d3iida.barChart()
      .width(width)
      .height(height)
      .on('customHover', function(d) {
        d3.select('#barChartMessage').text(d);
      });

    // グラフのコンテナは<div id='barChar'>を使う
    var container = d3.select('#barChart');

    // コンテナのセレクションにデータを紐付けてcall()する
    container.datum(data).call(barChart);

    // テスト。繰り返し実行して結果を観察する
    var doTest = true;
    if (doTest) {
      var repeat = 0;
      var dataTimer;
      var widthTimer;

      // テスト用。データを更新する
      var updateData = function() {
        repeat++;
        if (repeat === 10) {
          clearInterval(dataTimer);
          clearInterval(widthTimer);
        }
        data = d3iida.utils.rndNumbers(50, 100);

        // セレクションに新しいdataを紐付けてcall()する
        container.datum(data).call(barChart);
      };

      // テスト用。チャートのパラメータ変更（幅）
      var updateWidth = function() {
        width = 500;
        height = 300;

        // チャート側のパラメータを変更して、再度セレクションでcall()
        container.call(barChart.width(width).height(height));
      };

      dataTimer = setInterval(updateData, 1000);
      widthTimer = setInterval(updateWidth, 5000);
    }
   //
  };
  //
})();
