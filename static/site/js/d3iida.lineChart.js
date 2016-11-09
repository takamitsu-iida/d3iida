/* global d3, d3iida */

// 2016.11.03
// Takamitsu IIDA
// takamitsu.iida@gmail.com

// ライングラフモジュール
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
      .curve(d3.curveNatural); // d3.curveBasisOpen

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

    // 描画領域の大きさに変更はあるか
    var sizeChanged = false;

    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      _selection.each(function(_data) {
        if (!_data) {
          // データにnullを指定してcall()した場合は、既存のSVGを削除する
          d3.select(this).select('svg').remove();
          return;
        }

        // ダミーデータを紐付けることでsvgの重複作成を防止する
        var svgAll = d3.select(this).selectAll('svg').data(['dummy']);

        svgAll
          // ENTER領域
          .enter()
          .append('svg')
          .attr('debug', function() {
            console.log('new svg created');
          })
          // ENTER + UPDATE領域に対して設定すれば楽だけど、毎回変更するのは重たい
          // .merge(svgAll)
          .attr('width', width)
          .attr('height', height);

        // 実際に描画領域の大きさに変更がある場合だけUPDATE領域を変更する
        if (sizeChanged) {
          svgAll
            .attr('width', width)
            .attr('height', height);
        }

        // チャート描画領域'g'を追加
        var lineChartAll = d3.select(this).select('svg').selectAll('.lineChart').data(['dummy']);
        lineChartAll
          // ENTER領域
          .enter()
          .append('g')
          .classed('lineChart', true)
          // .merge(lineChartAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        if (sizeChanged) {
          lineChartAll
            .attr('width', w)
            .attr('height', h)
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        }

        lineChartAll
          // ENTER領域
          .enter()
          // id='clip'でクリップパスを定義して、領域外に描画されないようにする
          .append('defs')
          .append('clipPath')
          .attr('id', 'clip')
          .append('rect')
          .attr('width', w)
          .attr('height', h);

        // 作成済みの描画領域'g'を選択しておく
        var lineChart = d3.select(this).select('.lineChart');

        // x軸を追加する。クラス名はCSSと合わせる
        var xAxisAll = lineChart.selectAll('.x-axis').data(['dummy']);
        xAxisAll
          // ENTER領域
          .enter()
          .append('g')
          .classed('x-axis', true)
          // .merge(xAxisAll)
          .attr('transform', 'translate(0,' + h / 2 + ')')
          .call(d3.axisBottom(xScale).ticks(''));

        if (sizeChanged) {
          xAxisAll
            .attr('transform', 'translate(0,' + h / 2 + ')')
            .call(d3.axisBottom(xScale).ticks(''));
        }

        // y軸を追加する。クラス名はCSSと合わせる
        var yAxisAll = lineChart.selectAll('.y-axis').data(['dummy']);
        yAxisAll
          // ENTER領域
          .enter()
          .append('g')
          .classed('y-axis', true)
          // .merge(yAxisAll)
          .call(d3.axisLeft(yScale));

        if (sizeChanged) {
          yAxisAll.call(d3.axisLeft(yScale));
        }

        // X軸に対してグリッド線を引く(Y軸と平行の線)
        if (drawXGrid) {
          var xGridAll = lineChart.selectAll('.x-grid').data(['dummy']);
          xGridAll
            // ENTER領域
            .enter()
            .append('g')
            .classed('x-grid', true)
            // .merge(xGridAll)
            .call(make_x_gridlines().tickSize(-h).tickFormat(''));

          if (sizeChanged) {
            xGridAll.call(make_x_gridlines().tickSize(-h).tickFormat(''));
          }
        }

        // Y軸に対してグリッド線を引く(X軸と平行の線)
        if (drawYGrid) {
          var yGridAll = lineChart.selectAll('.y-grid').data(['dummy']);
          yGridAll
            // ENTER領域
            .enter()
            .append('g')
            .classed('y-grid', true)
            // .merge(yGridAll)
            .call(make_y_gridlines().tickSize(-w).tickFormat(''));

          if (sizeChanged) {
            yGridAll
              .call(make_y_gridlines().tickSize(-w).tickFormat(''));
          }
        }

        // トランジションのパラメータ
        var t = d3.transition().duration(750).ease(d3.easeLinear);

        // 既存のpathを左にズラす
        d3.select(this).select('.line')
          .attr('d', line)
          .attr('transform', null)
          .transition(t)
          .attr('transform', 'translate(' + xScale(-1) + ')');

        // 初回call()時のみpathを追加
        lineChart.selectAll('.pathG').data(['dummy'])
          // ENTER領域
          .enter()
          .append('g')
          .attr('clip-path', 'url(#clip)')
          .classed('pathG', true)
          .append('path')
          .datum(_data)
          .attr('d', line)
          .style('fill', 'none')
          .style('stroke', 'steelblue')
          .style('stroke-width', '1.5px')
          .classed('line', true); // スタイルはCSSで変えた方がよい

        sizeChanged = false;
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
      sizeChanged = true;
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      yScale.range([h, 0]);
      sizeChanged = true;
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

  // 使い方  <div id='lineChart'></div>内にグラフを描画する
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
