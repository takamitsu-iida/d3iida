/* global d3, d3iida */

// 棒グラフモジュール
(function() {
  d3iida.pieChart = function module() {
    // SVGの枠の大きさ
    var width = 500;
    var height = 500;

    // 'g'の描画領域となるデフォルトのマージン
    var margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    };

    // カスタムイベントを登録する
    var dispatch = d3.dispatch('customHover');

    // チャート描画領域のサイズw, h
    // 軸や凡例がはみ出てしまうので、マージンの分だけ小さくしておく。
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // 半径
    var outerRadius = d3.min([w, h]) / 2;
    var innerRadius = d3.min([w, h]) / 4;

    // ラベルをどのくらい内側に書くか
    var labelOffsetX = 5;
    var labelOffsetY = -5;

    // パスを生成するarc関数
    var chartArc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius).cornerRadius(6).padAngle(0.04);

    // データ名に対して色付けするためのスケール関数
    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // d3.pie()
    // かつてのd3.layout.pie()
    var pie = d3.pie()
      .sort(null)
      .value(function(d) {
        return d;
      });

    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      _selection.each(function(_data) {
        if (!_data) {
          // container.datum(null).call(pieChart);
          // のように、データにnullを指定してcall()した場合は、既存のSVGを削除する
          d3.select(this).selectAll('svg').remove();
          return;
        }

        // pie関数にデータを渡して新しいデータ配列を得る
        var data = pie(_data);
        // console.log(data);

        // 受け取ったデータを紐付けたSVGを作ることで、複数回call()されたときにSVGの重複作成を防止する
        var svgAll = d3.select(this).selectAll('svg').data([_data]);

        // ENTER領域
        // 既存のsvgがないならENTER領域にsvgを新規作成
        // チャート描画領域'g'を追加し、マージン分だけずらす
        svgAll.enter()
          .append('svg').attr('width', width).attr('height', height)
          .attr('debug', function() {
            console.log('new svg created');
          })
          .append('g').classed('pieChartG', true)
          .attr('transform', 'translate(' + (margin.left + w / 2) + ',' + (margin.top + h / 2) + ')');

        // ここまではENTER領域の処理なので、初回call()時のみ実行される
        // 以下はcall()のたびに実行される

        // 半径に修正があった場合に備えて設定しなおす
        chartArc.innerRadius(innerRadius).outerRadius(outerRadius);

        // チャート描画領域であるsvg直下の'g'をセレクト
        var g = d3.select(this).select('.pieChartG');

        // 'arcG'クラスを持つ'g'のセレクタ
        var arcAll = g.selectAll('.arcG').data(data);

        var arcEnter = arcAll.enter()
          .append('g')
          .classed('arcG', true);

        // ENTER領域
        arcEnter
          .append('path')
          .attr('d', function(d) {
            return chartArc(d);
          })
          .attr('id', function(d, i) {
            return 'arc-' + i;
          })
          .attr('stroke', 'gray')
          .attr('fill', function(d, i) {
            return color(i);
          })
          .each(function(d) {
            // console.log(d);
            this._current = d;
          })
          .on('mouseover', function() {
            // カスタムイベントをディスパッチする
            // dispatch.call('customHover', this, _data);
            dispatch.call('customHover', this, 'customHover');
          });

        arcEnter
          .append('text')
          .attr('dx', labelOffsetX) // 5
          .attr('dy', labelOffsetY) // -5
          .append('textPath')
          .attr('xlink:href', function(d, i) {
            return '#arc-' + i;
          })
          .text(function(d, i) {
            // console.log(d);
            return i;
          });

        // UPDATE領域
        arcAll.select('path').transition().attrTween('d', arcTween);

        // EXIT領域
        arcAll.exit().transition().style('opacity', 0).remove();
        //
      });
    }

    function arcTween(a) {
      var i = d3.interpolate(this._current, a);
      this._current = i(0);
      return function(t) {
        return chartArc(i(t));
      };
    }

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      innerRadius = d3.min([w, h]) / 4;
      outerRadius = d3.min([w, h]) / 2;
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      innerRadius = d3.min([w, h]) / 4;
      outerRadius = d3.min([w, h]) / 2;
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

  // 使い方  <div id='pieChart'></div>内に棒グラフを描画する
  d3iida.pieChart.example = function() {
    var n = 4;
    var random = d3.randomUniform(1, 5);

    // 4個のランダム値からなるデータ配列を作成する
    var data = d3.range(n).map(random);
    // console.log(data);

    var pieChart = d3iida.pieChart().width(600).height(600);

    // カスタムイベントにハンドラを登録する
    pieChart.on('customHover', function(d) {
      console.log(d);
    });

    // グラフのコンテナは<div id='pieChar'>を使う
    var container = d3.select('#pieChart');

    // コンテナのセレクションにデータを紐付けてcall()する
    container.datum(data).call(pieChart);

    var doTest = true;
    if (doTest) {
      // テスト用。データを更新する
      var repeatCount = 0;
      var timer;
      var updateData = function() {
        repeatCount++;
        if (repeatCount === 5) {
          container.datum(null).call(pieChart);
          pieChart.width(400).height(400);
          container.datum(data).call(pieChart);
        }
        if (repeatCount === 10) {
          clearInterval(timer);
        }

        // 配列の最後にランダムデータを追加
        data = d3.range(d3.randomUniform(n - 2, n + 2)()).map(random);
        // console.log(data);

        // コンテナに新しいデータを紐付けてcall()する
        container.datum(data).call(pieChart);
      };

      timer = setInterval(updateData, 1000);
    }
   //
  };
  //
})();
