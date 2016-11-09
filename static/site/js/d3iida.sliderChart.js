/* global d3, d3iida */

// 2016.11.09
// Takamitsu IIDA
// takamitsu.iida@gmail.com

// スライダ付きラインモジュール
(function() {
  d3iida.sliderChart = function module(_accessor) {
    // svgを作る必要があるならインスタンス化するときにtrueを渡す
    // 例： var chart = sliderChart(true);
    var needsvg = arguments.length ? _accessor : false;

    // call()時に渡されたデータ
    var data;

    //
    // クラス名定義
    //

    // 一番下のレイヤ
    var CLASS_BASE_LAYER = 'sc-base-layer';

    // スライダモジュールを配置するレイヤ
    var CLASS_SLIDER_LAYER = 'sc-slider-layer';

    // チャートを配置するレイヤ
    var CLASS_CHART_LAYER = 'sc-chart-layer';

    // チャートのラインとエリア
    var CLASS_CHART_LINE = 'sc-chart-line'; // CSSでスタイル指定
    var CLASS_CHART_AREA = 'sc-chart-area'; // CSSでスタイル指定

    // タイムライン表示の縦線と丸
    var CLASS_TIMELINE = 'sc-chart-timeline'; // CSSでスタイル指定
    var CLASS_TCIRCLE = 'sc-chart-tcircle'; // CSSでスタイル指定

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

    // スケール関数とレンジ指定
    var xScale = d3.scaleLinear().range([0, w]);
    var yScale = d3.scaleLinear().range([h, 0]);

    // ドメイン指定は、データ入手後に行う
    var xdomain;
    var ydomain;

    // 軸に付与するticksパラメータ
    var xticks;
    var yticks;

    // 軸のテキスト
    var xAxisText = '時刻';
    var yAxisText = '潮位(cm)';

    // X軸
    var xaxis = d3.axisBottom(xScale); // .ticks(xticks);

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
    // タイムラインとの交点を探るのに必要
    var linePath;

    // 塗りつぶしエリアのパスジェネレータ
    var area = d3.area().curve(d3.curveNatural);

    // パスジェネレータにスケールを適用する関数
    // データは [[0, 107], [1, 102],
    // という構造を想定しているので、x軸はd[0]、y軸はd[1]になる
    function setScale() {
      // ライン用パスジェネレータにスケールを適用する
      line
        .x(function(d) {
          return xScale(d[0]);
        })
        .y(function(d) {
          return yScale(d[1]);
        });

      // エリア用パスジェネレータにスケールを適用する
      area
        .x(function(d) {
          return xScale(d[0]);
        })
        .y0(h)
        .y1(function(d) {
          return yScale(d[1]);
        });
      //
    }

    // 実際にパスジェネレータにスケールを適用するのは
    // データ入手後に軸のドメインを決めて、スケールを作り直してから
    // setScale();

    // レイヤにチャートを描画する
    function drawChart(layer, data) {
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
        .attr('transform', 'translate(0,' + h + ')')
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

        var sliderChartAreaAll = pathG.selectAll('.' + CLASS_CHART_AREA).data(['dummy']);
        sliderChartAreaAll
          .enter()
          .append('path')
          .classed(CLASS_CHART_AREA, true)
          .merge(sliderChartAreaAll)
          .datum(data)
          .attr('d', area);

        var sliderChartLineAll = pathG.selectAll('.' + CLASS_CHART_LINE).data(['dummy']);
        linePath = sliderChartLineAll
          .enter()
          .append('path')
          .classed(CLASS_CHART_LINE, true)
          .merge(sliderChartLineAll)
          .datum(data)
          .attr('d', line);
        //

        // 作成したレイヤを返却する
        return sliderChart;
      }
    }

    //
    // タイムラインをセットアップする
    //

    // 入力ドメイン i=0～1 として、出力レンジを実際の時刻に変換するスケールを作成する
    // 例えば、0を指定したときが7時、1を指定したときが14時、というようにする
    var trange = [7, 14];
    var iScale = d3.scaleLinear()
      .domain([0, 1])
      .range(trange); // [7, 14]

    // さらに、その時刻をX座標に変換するスケールを作るのだが
    // この時点ではxScaleのドメインがまだ設定されていないので、
    // インスタンス変数だけ定義して後から設定する
    var tScale; // = function(i) { return xScale(iScale(i)); };

    // タイムライン用のパスジェネレータ
    var tline = d3.line()
      .x(function(d) {
        return d[0];
      })
      .y(function(d) {
        return d[1];
      });

    // タイムライン用のパスジェネレータで生成された縦線のパス
    var tpath;

    // タイムラインの交点に配置する'circle'のセレクタ
    var tcircle;

    // タイムラインを追加する
    function drawTimeline(sliderChart) {
      // 初期値
      var t = 0.0;
      var tx1 = tScale(t);
      var ty1 = 0;
      var tx2 = tScale(t);
      var ty2 = h;
      var tdata = [[tx1, ty1], [tx2, ty2]];

      var sliderChartTimelineAll = sliderChart.selectAll('.' + CLASS_TIMELINE).data(['dummy']);
      tpath = sliderChartTimelineAll
        .enter()
        .append('path')
        .classed(CLASS_TIMELINE, true)
        .merge(sliderChartTimelineAll)
        .attr('d', tline(tdata));

      var tcircleAll = sliderChart.selectAll('.' + CLASS_TCIRCLE).data(['dummy']);
      tcircle = tcircleAll
        .enter()
        .append('circle')
        .classed(CLASS_TCIRCLE, true)
        .merge(tcircleAll)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', '6');

      // 0すなわち7時のところに線を引く。あとはこれを移動する。
      setTimeline(0);
    }

    // ソートされた配列に対して近傍値のインデックスを返してくれる関数
    var xbisector = d3.bisector(function(d) {
      return d[0];
    }).right;

    // i=0～1を引数にして、時刻に応じた場所に縦線を移動する
    function setTimeline(i) {
      // X座標はtScale関数を通せば分かる
      var x = tScale(i);

      // 縦線をひくためのデータはこれでよい
      var tdata = [[x, 0], [x, h]];

      // そのデータをパスジェネレータに渡して、パスを移動する
      tpath.attr('d', tline(tdata));

      // その２を使う
      var method = 2;

      // ラインとの交点を探る方法・その１
      // ラインのパスを先頭から徐々に移動してX座標がその場所になるまで探っていく方法
      // accuracyは小さい方が正確だけどループから抜けるのに時間がかかる。
      // ●の半径が6なので、その半分に収まればよいものとする
      if (method === 1) {
        var pathEl = linePath.node();
        var pathLength = pathEl.getTotalLength();
        var accuracy = 3;

        var j;
        var pos;
        for (j = x; j < pathLength; j += accuracy) {
          pos = pathEl.getPointAtLength(j);
          if (pos.x >= x) {
            break;
          }
        }

        tcircle.attr('cx', x).attr('cy', pos.y);
      }

      // ラインとの交点を探る方法・その２
      // 近傍のデータで補完する
      if (method === 2) {
        // 時刻
        var t = iScale(i);
        var index = xbisector(data, t);
        var startDatum = data[index - 1];
        var endDatum = data[index];
        var interpolate = d3.interpolateNumber(startDatum[1], endDatum[1]);
        var range = endDatum[0] - startDatum[0];
        var valueY = interpolate((t % range) / range);
        var y = yScale(valueY);

        tcircle.attr('cx', x).attr('cy', y);
      }

      //
    }

    // スライダモジュールをインスタンス化する
    // 'hue' イベントを拾ってタイムラインを移動する
    var slider = d3iida.slider().on('hue', function(d) {
      setTimeline(d);
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

    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      _selection.each(function(_data) {
        data = _data;
        var container = _selection;

        if (!_data) {
          // データにnullを指定してcall()した場合は、既存の描画領域を削除して終了
          container.select('.sliderChartLayer').remove();
          return;
        }

        // 受け取ったデータで入力ドメインを設定
        if (!xdomain) {
          // データの[最小値, 最大値]の配列
          var xextent = d3.extent(_data, function(d) {
            return d[0];
          });
          xScale.domain(xextent);
        }
        if (!ydomain) {
          var yextent = d3.extent(_data, function(d) {
            return d[1];
          });
          yScale.domain(yextent);
        }

        // 変更したスケールをパスジェネレータに適用する
        setScale();

        // 変更したスケールをタイムライン用のスケール関数に適用する
        // tScaleはi=0~1の入力に対してX座標に変換する
        tScale = function(i) {
          return xScale(iScale(i));
        };

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
        var layerAll = container.selectAll('.' + CLASS_BASE_LAYER).data(['dummy']);
        var layer = layerAll
          // ENTER領域
          .enter()
          .append('g')
          .classed(CLASS_BASE_LAYER, true)
          // ENTER + UPDATE領域
          .merge(layerAll)
          .attr('width', width)
          .attr('height', height);

        // レイヤにスライダを配置する
        drawSlider(layer);

        // レイヤにチャートを配置する
        var sliderChart = drawChart(layer, _data);

        // チャートにタイムラインを追加する
        drawTimeline(sliderChart);

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

    exports.trange = function(_) {
      if (!arguments.length) {
        return trange;
      }
      trange = _;
      iScale.range(trange);
      return this;
    };

    return exports;
  };

  // 使い方  <div id='sliderChart'></div>内にグラフを描画する
  d3iida.sliderChart.example = function() {
    // データを用意する

    // 公開されている潮位のテキストデータを使う
    // http://www.data.jma.go.jp/kaiyou/db/tide/suisan/index.php
    var text = ' 50 69 96124145156152136112 85 64 54 57 74 98124145155151134108 79 54 401610 2Z1 5151561713155999999999999991115 532329 3899999999999999';

    var tideDatas = [];
    var m;
    for (m = 0; m < 24; m++) {
      var str = text.substr(m * 3, 3);
      var num = parseInt(str, 10) || 0;
      tideDatas.push([m, num]);
    }

    // この処理でtideDatas配列は、[時刻, 潮位]の配列の配列になる
    //  [[0, 107],
    //   [1, 102],
    //   [2, 96],

    // console.log(tideDatas);

    var chart = d3iida.sliderChart(true);

    // 大きめにする
    chart.width(600).height(400);

    // 潮汐データの最小値と最大値はこんなものかな
    chart.ydomain([-10, 150]);

    // Y軸のticksを調整する
    chart.yticks(5);

    // タイムラインは6時~15時の情報に対して縦線を書く
    chart.trange([6, 15]);

    // グラフのコンテナは<div id='sliderChar'>を使う
    var container = d3.select('#sliderChart');

    // コンテナのセレクションにデータを紐付けてcall()する
    container.datum(tideDatas).call(chart);

   //
  };
  //
})();
