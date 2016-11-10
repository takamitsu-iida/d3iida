/* global d3, d3iida */

// 2016.11.09
// Takamitsu IIDA
// takamitsu.iida@gmail.com

// 破線を工夫してニョロニョロ動いているようにみせるチャート
(function() {
  d3iida.tweenChart = function module(_accessor) {
    // svgを作る必要があるならインスタンス化するときにtrueを渡す
    // 例： var chart = sliderChart(true);
    var needsvg = arguments.length ? _accessor : false;

    //
    // クラス名定義
    //

    // 一番下のレイヤ
    var CLASS_BASE_LAYER = 'tc-base-layer';

    // スライダモジュールを配置するレイヤ
    var CLASS_SLIDER_LAYER = 'tc-slider-layer';

    // チャートを配置するレイヤ
    var CLASS_CHART_LAYER = 'tc-chart-layer';

    // チャートにおけるライン、sinとcos
    var CLASS_CHART_SLINE = 'tc-chart-sline'; // CSSでスタイル指定
    var CLASS_CHART_SLINE2 = 'tc-chart-sline2'; // CSSでスタイル指定
    var CLASS_CHART_CLINE = 'tc-chart-cline'; // CSSでスタイル指定
    var CLASS_CHART_CLINE2 = 'tc-chart-cline2'; // CSSでスタイル指定

    // チャートにおけるマーカー、sinとcos
    var CLASS_CHART_SMARKER = 'tc-chart-smarker';
    var CLASS_CHART_CMARKER = 'tc-chart-cmarker';

    // 外枠の大きさ
    var width = 420;
    var height = 160;

    // 描画領域のマージン
    var margin = {
      top: 100,
      right: 0,
      bottom: 20,
      left: 30
    };

    // 描画領域のサイズw, h
    // 軸や凡例がはみ出てしまうので、マージンの分だけ小さくしておく。
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // スケール関数と出力レンジ指定
    var xScale = d3.scaleLinear().range([0, w]);
    var yScale = d3.scaleLinear().range([h, 0]);

    // 入力ドメイン指定は、データ入手後にsetDomain()を呼び出す
    var xdomain; // = [0, 99];
    var ydomain; // = [-1, 1];

    // 複数のデータを配列で受け取ることを前提に最小値・最大値を割り出す
    function setDomain(data) {
      if (!xdomain) {
        // データの[最小値, 最大値]の配列
        var xextent = [
          // 各データの最小値を集めて、それの最小値を得る
          d3.min(data, function(d) {
            return d3.min(d, function(v) {
              return v[0]; // [x, y]のデータを想定 xは0番目
            });
          }),
          d3.max(data, function(d) {
            return d3.max(d, function(v) {
              return v[0]; // [x, y]のデータを想定 xは0番目
            });
          })
        ];
        xScale.domain(xextent);
      }
      if (!ydomain) {
        var yextent = [
          d3.min(data, function(d) {
            return d3.min(d, function(v) {
              return v[1]; // [x, y]のデータを想定 yは1番目
            });
          }),
          d3.max(data, function(d) {
            return d3.max(d, function(v) {
              return v[1]; // [x, y]のデータを想定 yは1番目
            });
          })
        ];
        yScale.domain(yextent);
      }
    }

    // 軸に付与するticksパラメータ
    var xticks = 0;
    var yticks;

    // 軸のテキスト
    var xAxisText = '';
    var yAxisText = '';

    // X軸
    var xaxis = d3.axisBottom(xScale).ticks(xticks);

    // Y軸
    var yaxis = d3.axisLeft(yScale); // .ticks(yticks);

    // X軸に付与するグリッドライン（Y軸と平行のグリッド線）
    var drawXGrid = false;
    function make_x_gridlines() {
      return d3.axisBottom(xScale);
    }

    // Y軸に付与するグリッドライン（X軸と平行のグリッド線）
    var drawYGrid = true;
    function make_y_gridlines() {
      return d3.axisLeft(yScale).ticks(yticks);
    }

    // ライン用のパスジェネレータ
    var line = d3.line().curve(d3.curveNatural);

    // ライン用のパスジェネレータで出力されたパス
    var spath2;
    var cpath2;

    // パスの長さ
    var spathLength;
    var cpathLength;

    // interpolateString関数
    var spathInterpolateString; //  = d3.interpolateString('0,' + l, l + ',' + l);
    var cpathInterpolateString; //  = d3.interpolateString('0,' + l, l + ',' + l);

    // マーカーの'circle'
    var smarker;
    var cmarker;

    // パスジェネレータにスケールを適用する関数
    // データは [[0, 107], [1, 102],
    // という構造を想定しているので、x軸はd[0]、y軸はd[1]になる
    function setScale() {
      line
        .x(function(d) {
          return xScale(d[0]);
        })
        .y(function(d) {
          return yScale(d[1]);
        });
      //
    }

    // レイヤにチャートを描画する
    function drawChart(layer, data) {
      var d0 = data[0];
      var d1 = data[1];

      // チャート描画領域'g'を追加
      var sliderChartAll = layer.selectAll('.' + CLASS_CHART_LAYER).data(['dummy']);
      var sliderChart = sliderChartAll
        // ENTER領域
        .enter()
        .append('g')
        .classed(CLASS_CHART_LAYER, true)
        // ENTER + UPDATE領域
        .merge(sliderChartAll)
        .attr('width', w)
        .attr('height', h)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // x軸を追加する
      var xAxisAll = sliderChart.selectAll('.x-axis').data(['dummy']);
      xAxisAll
        // ENTER領域
        .enter()
        .append('g')
        .classed('x-axis', true)
        // ENTER + UPDATE領域
        .merge(xAxisAll)
        .attr('transform', 'translate(0,' + h / 2 + ')')
        .call(xaxis);

      // X軸のラベルを追加
      var xAxisTextAll = sliderChart.selectAll('.x-axis-text').data(['dummy']);
      xAxisTextAll
        // ENTER領域
        .enter()
        .append('text')
        .classed('x-axis-text', true)
        // ENTER + UPDATE領域
        .merge(xAxisTextAll)
        .attr('x', w - 8)
        .attr('y', h - 8)
        .style('text-anchor', 'end')
        .text(xAxisText);

      // y軸を追加する。クラス名はCSSと合わせる
      var yAxisAll = sliderChart.selectAll('.y-axis').data(['dummy']);
      yAxisAll
        // ENTER領域
        .enter()
        .append('g')
        .classed('y-axis', true)
        // ENTER + UPDATE領域
        .merge(yAxisAll)
        .call(yaxis);

      // Y軸のラベルを追加
      var yAxisTextAll = sliderChart.selectAll('.y-axis-text').data(['dummy']);
      yAxisTextAll
        // ENTER領域
        .enter()
        .append('text')
        .classed('y-axis-text', true)
        // ENTER + UPDATE領域
        .merge(yAxisTextAll)
        .attr('transform', 'rotate(-90)')
        .attr('x', -8)
        .attr('y', 8)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text(yAxisText);

      // X軸に対してグリッド線を引く(Y軸と平行の線)
      if (drawXGrid) {
        var xGridAll = sliderChart.selectAll('.x-grid').data(['dummy']);
        xGridAll
          // ENTER領域
          .enter()
          .append('g')
          .classed('x-grid', true)
          .merge(xGridAll)
          .call(make_x_gridlines().tickSize(-h).tickFormat(''));
        //
      }

      // Y軸に対してグリッド線を引く(X軸と平行の線)
      if (drawYGrid) {
        var yGridAll = sliderChart.selectAll('.y-grid').data(['dummy']);
        yGridAll
          // ENTER領域
          .enter()
          .append('g')
          .classed('y-grid', true)
          .merge(yGridAll)
          .call(make_y_gridlines().tickSize(-w).tickFormat(''));
      }

      // グラフを表示
      var pathGAll = sliderChart.selectAll('.pathG').data(['dummy']);
      var pathG = pathGAll
        // ENTER領域
        .enter()
        .append('g')
        .classed('pathG', true)
        .merge(pathGAll)
        .attr('width', w)
        .attr('height', h);

      var slineAll = pathG.selectAll('.' + CLASS_CHART_SLINE).data(['dummy']);
      slineAll
        .enter()
        .append('path')
        .classed(CLASS_CHART_SLINE, true)
        .merge(slineAll)
        .datum(d0)
        .attr('d', line);

      var sline2All = pathG.selectAll('.' + CLASS_CHART_SLINE2).data(['dummy']);
      spath2 = sline2All
        .enter()
        .append('path')
        .classed(CLASS_CHART_SLINE2, true)
        .merge(sline2All)
        .datum(d0)
        .attr('d', line)
        .attr('stroke-dashoffset', 0);

      var clineAll = pathG.selectAll('.' + CLASS_CHART_CLINE).data(['dummy']);
      clineAll
        .enter()
        .append('path')
        .classed(CLASS_CHART_CLINE, true)
        .merge(clineAll)
        .datum(d1)
        .attr('d', line);

      var cline2All = pathG.selectAll('.' + CLASS_CHART_CLINE2).data(['dummy']);
      cpath2 = cline2All
        .enter()
        .append('path')
        .classed(CLASS_CHART_CLINE2, true)
        .merge(cline2All)
        .datum(d1)
        .attr('d', line)
        .attr('stroke-dashoffset', 0);
      //

      // パスの全長
      var l;
      spathLength = l = spath2.node().getTotalLength();
      spathInterpolateString = d3.interpolateString('0,' + l, l + ',' + l);

      cpathLength = l = cpath2.node().getTotalLength();
      cpathInterpolateString = d3.interpolateString('0,' + l, l + ',' + l);

      // 作成したレイヤを返却する
      return sliderChart;
    }

    // スライダモジュールをインスタンス化する
    // 'hue' イベントを拾ってマーカーを移動する
    var slider = d3iida.slider().on('hue', function(d) {
      setMarkerPosition(d);
    });

    function drawSlider(layer) {
      // レイヤにスライダモジュールを配置する領域'g'を作成する
      var sliderLayerAll = layer.selectAll('.' + CLASS_SLIDER_LAYER).data(['dummy']);
      var sliderLayer = sliderLayerAll
        // ENTER領域
        .enter()
        .append('g')
        .classed(CLASS_SLIDER_LAYER, true)
        // ENTER + UPDATE領域
        .merge(sliderLayerAll);

      sliderLayer.call(slider);

      // 作成したレイヤを返却する
      return sliderLayer;
    }

    // マーカーの●を作る
    function drawMarker(layer) {
      var smarkerAll = layer.selectAll('.' + CLASS_CHART_SMARKER).data(['dummy']);
      smarker = smarkerAll
        .enter()
        .append('circle')
        .classed(CLASS_CHART_SMARKER, true)
        .merge(smarkerAll)
        .attr('r', 5)
        .attr('fill', 'purple');

      var cmarkerAll = layer.selectAll('.' + CLASS_CHART_CMARKER).data(['dummy']);
      cmarker = cmarkerAll
        .enter()
        .append('circle')
        .classed(CLASS_CHART_CMARKER, true)
        .merge(smarkerAll)
        .attr('r', 5)
        .attr('fill', 'purple');
      //
    }

    function setMarkerPosition(t) {
      var sda;
      sda = getStrokeDashArray(t, spathInterpolateString);
      spath2.attr('stroke-dasharray', sda);

      sda = getStrokeDashArray(t, cpathInterpolateString);
      cpath2.attr('stroke-dasharray', sda);

      // マーカーを先頭に移動
      var p;
      p = spath2.node().getPointAtLength(t * spathLength);
      smarker
        .attr('cx', p.x)
        .attr('cy', p.y);

      p = cpath2.node().getPointAtLength(t * cpathLength);
      cmarker
        .attr('cx', p.x)
        .attr('cy', p.y);

      //
    }

    // 破線の描画を工夫する。引数は0～1の間の数字。
    function getStrokeDashArray(t, i) {
      // interpolateString iは端点を指定するとその間を補完してくれる関数を作成してくれる。
      // 中間点tを指定してi(t)を呼び出すと、中間点の長さ, トータル長、を得る。

      var drawlen = 60;
      var cols = i(t).split(','); // 文字列なのでコンマでスプリット。cols[0]が中間点、colos[1]が終点
      var result;
      if (cols[0] < drawlen) {
        result = i(t);
      } else {
        var hidden = cols[0] - drawlen;
        result = '0,' + hidden + ',' + drawlen + ',' + cols[1];
        // 書く、書かない、書く、書かない、の順に指定
      }
      // console.log(result);

      // 出発点から描画するなら単純にi(t)を戻せばよいが、ここでは破線のデータを返す
      return result;
    }

    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      _selection.each(function(_data) {
        var container = _selection;

        if (!_data) {
          // データにnullを指定してcall()した場合は、既存の描画領域を削除して終了
          container.select('.sliderChartLayer').remove();
          return;
        }

        // 受け取ったデータで入力ドメインを設定
        setDomain(_data);

        // スケール関数の変更をパスジェネレータに反映する
        setScale();

        // svgの作成を必要とするなら、新たにsvgを作成して、それをコンテナにする
        if (needsvg) {
          var svgAll = container.selectAll('svg').data(['dummy']);
          container = svgAll
            .enter()
            .append('svg')
            .merge(svgAll)
            .attr('width', width)
            .attr('height', height);
        }

        // コンテナに直接描画するのは気がひけるので、レイヤを１枚追加する
        var blayerAll = container.selectAll('.' + CLASS_BASE_LAYER).data(['dummy']);
        var blayer = blayerAll
          // ENTER領域
          .enter()
          .append('g')
          .classed(CLASS_BASE_LAYER, true)
          // ENTER + UPDATE領域
          .merge(blayerAll)
          .attr('width', width)
          .attr('height', height);

        // ベースレイヤにスライダを配置する
        drawSlider(blayer);

        // ベースレイヤにチャートを配置する
        var clayer = drawChart(blayer, _data);

        // チャートレイヤにマーカーを配置する
        drawMarker(clayer);

        //
      });
    }

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;

      // スケール関数を直す
      xScale.range([0, w]);

      // スケールを変更したので、パスジェネレータも直す
      setScale();

      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      yScale.range([h, 0]);

      // スケールを変更したので、パスジェネレータも直す
      setScale();

      return this;
    };

    exports.xAxisText = function(_) {
      if (!arguments.length) {
        return xAxisText;
      }
      xAxisText = _;
      return this;
    };

    exports.yAxisText = function(_) {
      if (!arguments.length) {
        return yAxisText;
      }
      yAxisText = _;
      return this;
    };

    exports.xdomain = function(_) {
      if (!arguments.length) {
        return xdomain;
      }
      xdomain = _;
      xScale.domain(xdomain);
      return this;
    };

    exports.ydomain = function(_) {
      if (!arguments.length) {
        return ydomain;
      }
      ydomain = _;
      yScale.domain(ydomain);
      return this;
    };

    exports.xticks = function(_) {
      if (!arguments.length) {
        return xticks;
      }
      xticks = _;
      xaxis.ticks(xticks);
      return this;
    };

    exports.yticks = function(_) {
      if (!arguments.length) {
        return yticks;
      }
      yticks = _;
      yaxis.ticks(yticks);
      return this;
    };

    return exports;
  };

  // 使い方  <div id='sliderChart'></div>内にグラフを描画する
  d3iida.tweenChart.example = function() {
    // データを用意する

    var d0 = d3.range(0, Math.PI * 3).map(function(i) {
      return [i, Math.sin(i)];
    });

    var d1 = d3.range(0, Math.PI * 3).map(function(i) {
      return [i, Math.cos(i)];
    });

    var chart = d3iida.tweenChart(true);

    // 大きめにする
    chart.width(600).height(400);

    // グラフのコンテナは<div id='sliderChar'>を使う
    var container = d3.select('#tweenChart');

    // コンテナのセレクションにデータを紐付けてcall()する
    container.datum([d0, d1]).call(chart);

   //
  };
  //
})();
