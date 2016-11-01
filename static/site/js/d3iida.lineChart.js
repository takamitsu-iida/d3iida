/* global d3, d3iida */

// 2016.11.01
// Takamitsu IIDA
// takamitsu.iida@gmail.com

// 棒グラフモジュール
(function() {
  d3iida.lineChart = function module() {
    // SVGの枠の大きさ
    var width = 600;
    var height = 400;

    // 'g'の描画領域となるデフォルトのマージン
    var margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 40
    };

    // チャート描画領域のサイズw, h
    // 軸や凡例がはみ出てしまうので、マージンの分だけ小さくしておく。
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // カスタムイベントを登録する
    var dispatch = d3.dispatch('customHover');

    // スケール関数
    var xScale = d3.scaleLinear().domain([0, 39]).range([0, w]);
    var yScale = d3.scaleLinear().domain([-1, 1]).range([h, 0]);

    // ライン関数
    var line = d3.line()
      .x(function(d, i) {
        return xScale(i);
      })
      .y(function(d, i) {
        return yScale(d);
      })
      .curve(d3.curveBasisOpen);

    // パス
    var path;

    // X軸に付与するグリッドライン（Y軸と平行のグリッド線）
    var drawXGrid = false;
    function make_x_gridlines() {
      return d3.axisBottom(xScale); // .ticks(24);
    }

    // Y軸に付与するグリッドライン（X軸と平行のグリッド線）
    var drawYGrid = true;
    function make_y_gridlines() {
      return d3.axisLeft(yScale); // .ticks(5);
    }

    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      _selection.each(function(_data) {
        if (!_data) {
          // container.datum(null).call(lineChart);
          // のように、データにnullを指定してcall()した場合は、既存のSVGとpathを削除する
          path = null;
          d3.select(this).selectAll('svg').remove();
          return;
        }

        // 受け取ったデータを紐付けたSVGを作ることで、複数回call()されたときにSVGの重複作成を防止する
        var svgAll = d3.select(this).selectAll('svg').data([_data]);

        // ENTER領域
        // 初回call()時のみ
        // svgを新規作成し、チャート描画領域'g'を追加、マージン分だけずらす
        var enterG = svgAll.enter()
          .append('svg')
          .attr('width', width).attr('height', height)
          .attr('debug', function() {
            console.log('new svg created');
          })
          .append('g')
          .classed('lineChartG', true)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // id='clip'でクリップパスを定義して、領域外に描画されないようにする
        enterG.append('defs').append('clipPath').attr('id', 'clip').append('rect').attr('width', w).attr('height', h);

        // x軸を追加する。クラス名はCSSと合わせる
        enterG.append('g').attr('class', 'x axis xaxis').attr('transform', 'translate(0,' + h / 2 + ')').call(d3.axisBottom(xScale).ticks(''));

        // y軸を追加する。クラス名はCSSと合わせる
        enterG.append('g').attr('class', 'y axis yaxis').call(d3.axisLeft(yScale));

        // X軸に対してグリッド線を引く(Y軸と平行の線)
        if (drawXGrid) {
          enterG.append('g').attr('class', 'grid xgrid').call(make_x_gridlines().tickSize(-h).tickFormat(''));
        }

        // Y軸に対してグリッド線を引く(X軸と平行の線)
        if (drawYGrid) {
          enterG.append('g').attr('class', 'grid').call(make_y_gridlines().tickSize(-w).tickFormat(''));
        }

        // チャート描画領域であるsvg直下の'g'をセレクト
        var g = d3.select(this).select('.lineChartG');

        if (path) {
          // 既にパスを描画済みなら、パスのアトリビュートを更新して、左にズラす
          var t = d3.transition().duration(750).ease(d3.easeLinear);
          path.attr('d', line).attr('transform', null).transition(t).attr('transform', 'translate(' + xScale(-1) + ')');
        } else {
          // 新規描画
          // line関数を渡してパスを作成する
          path = g.append('g').attr('clip-path', 'url(#clip)')
            .append('path')
            .datum(_data)
            .attr('class', 'line')
            .attr('d', line);

          path.on('mouseover', function() {
            // カスタムイベントをディスパッチする
            // dispatch.call('customHover', this, _data);
            dispatch.call('customHover', this, 'customHover');
          });
        }
        //
      });
    }

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      xScale.range([0, w]);
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      yScale.range([h, 0]);
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

  // 使い方  <div id='lineChart'></div>内に棒グラフを描画する
  d3iida.lineChart.example = function() {
    var n = 40;
    var random = d3.randomNormal(0, .2);

    // データ配列を作成する
    var data = d3.range(n).map(random);
    // console.log(data);

    var lineChart = d3iida.lineChart().width(600).height(400);

    // カスタムイベントにハンドラを登録する
    lineChart.on('customHover', function(d) {
      console.log(d);
    });

    // グラフのコンテナは<div id='lineChar'>を使う
    var container = d3.select('#lineChart');

    // コンテナのセレクションにデータを紐付けてcall()する
    container.datum(data).call(lineChart);

    // テスト用。データを更新する
    var repeatCount = 0;
    var timer;
    var updateData = function() {
      repeatCount++;
      if (repeatCount === 5) {
        container.datum(null).call(lineChart);
        lineChart.width(400).height(300);
        container.datum(data).call(lineChart);
      }
      if (repeatCount === 10) {
        clearInterval(timer);
      }

      // 配列の最後にランダムデータを追加
      data.push(random());

      // 配列の先頭を削除
      data.shift();

      // コンテナに新しいデータを紐付けてcall()する
      container.datum(data).call(lineChart);
    };

    timer = setInterval(updateData, 1000);
   //
  };
  //
})();
