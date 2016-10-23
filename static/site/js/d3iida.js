/* global d3, d3iida */

// グローバルに独自の名前空間を定義する
(function() {
  // このthisはグローバル空間
  this.d3iida = (function() {
    // ヒアドキュメント経由で静的データを取り込む場合、テキストデータをheredoc配下にぶら下げる
    var heredoc = {};

    // ユーティリティ関数を作る場合には、d3iida.utils配下にぶら下げる
    var utils = {};

    // 公開するオブジェクト
    return {
      utils: utils,
      heredoc: heredoc
    };
  })();
  //
})();

// ユーティリティ関数を定義する
(function() {
  // x軸向きのデータの数がいくつあるのかを調べる
  d3iida.utils.calcTicksX = function(numTicks, data) {
    var numValues = 1;
    var i;
    for (i = 0; i < data.length; i++) {
      var stream_len = data[i] && data[i].values ? data[i].values.length : 0;
      numValues = stream_len > numValues ? stream_len : numValues;
    }
    numTicks = numTicks > numValues ? numTicks = numValues - 1 : numTicks;
    numTicks = numTicks < 1 ? 1 : numTicks;
    numTicks = Math.floor(numTicks);
    return numTicks;
  };

  // リサイズ用のハンドラ登録関数
  // 使い方
  // var clearFn = d3iida.utils.windowResize(chart.update);
  d3iida.utils.windowResize = function(handler) {
    if (window.addEventListener) {
      window.addEventListener('resize', handler);
    } else {
      console.warn('Failed to bind to window.resize with: ', handler);
    }
    // イベントハンドラを削除する関数を返却する
    return function() {
      window.removeEventListener('resize', handler);
    };
  };

  // テスト用にランダムな値を作成する
  d3iida.utils.rndNum = function(min, max) {
    var mi = min || 100;
    var ma = max || 500;
    var rnd = ~~(Math.random() * ma);
    rnd = rnd < mi ? mi : rnd;
    return rnd;
  };

  // テスト用にランダムな値の配列を作成する
  d3iida.utils.rndNumbers = function(len, max) {
    var l = len || 50;
    var m = max || 100;
    // ランダム値をランダム個作成する。この方法が高速らしい。
    var nums = d3.range(~~(Math.random() * l)).map(function(d, i) {
      return ~~(Math.random() * m);
    });
    return nums;
  };
  //
})();

// モジュール化の動作確認
// helloモジュール
(function() {
  d3iida.hello = function module() {
    // プライベート変数
    var fontSize = 10;
    var fontColor = 'red';

    // 外部にイベントを公開できるようにするためにd3.dispatchを使う。
    // イベント名は任意でよく、ここではcustomHoverにする
    // イベントは何個でも並べられる
    var dispatch = d3.dispatch('customHover', 'anyEvent');

    // d3でデータを紐付けしたあとcall()することでこれが呼ばれる
    function exports(_selection) {
      _selection.each(function(_data) {
        // _dataは紐付けしたデータそのもの。配列全体。
        d3.select(this)
          .append('div')
          .styles({
            'font-size': fontSize + 'px',
            'color': fontColor
          })
          .html('_data = ' + _data)
          .on('mouseover', function() {
            // カスタムイベントをディスパッチする
            dispatch.call('customHover', this, _data);
          });
      });
    }

    // クロージャ定義

    // fontSize()
    exports.fontSize = function(_x) {
      if (!arguments.length) {
        return fontSize;
      }
      fontSize = _x;
      return this;
    };

    // fontColor()
    exports.fontColor = function(_x) {
      if (!arguments.length) {
        return fontColor;
      }
      fontColor = _x;
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

    // 呼び出し元にはexportsを返却する。
    return exports;
  };

  // 使い方
  d3iida.hello.example = function() {
    // データセット
    var dataset = [10, 20, 30, 40, 50];

    // hello()モジュールをインスタンス化
    var hello = d3iida.hello().fontSize('20').fontColor('green');

    // カスタムイベントにハンドラを登録する
    hello.on('customHover', function(d) {
      console.log(d);
    });

    // セレクションにデータを紐付けてcall()する
    d3.select('#hello').datum(dataset).call(hello);
  };
  //
})();

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

    var i = 0;

    function exports(_selection) {
      _selection.each(function(_data) {
        console.log(i);
        console.log(_data);
        i++;

        var barW = w / _data.length;
        var scaling = h / d3.max(_data);

        // 受け取ったデータを紐付けたSVGを作ることで、複数回call()されたときにSVGの重複作成を防止する
        var svg = d3.select(this).selectAll('svg').data([_data]);

        // ENTER領域
        // 既存のsvgがないならenter()領域に新規作成
        svg.enter().append('svg').attr('width', width).attr('height', height).append('g').classed('barChartG', true);

        // 再セレクト
        svg = d3.select(this).select('svg');

        // svgの大きさを合わせる
        // 大きさを変更した場合は再度call()
        svg.attr('width', width).attr('height', height);

        // 'g'を取り出す
        var g = svg.select('.barChartG');

        // 'g'はマージン分だけ描画領域をずらす
        g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // transitionインスタンス
        var t = d3.transition().ease(d3.easeLinear);

        // 棒グラフを'g'内に作成
        var bars = g.selectAll('.bar')
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
          .attrs({
            width: barW,
            x: w,
            y: function(d, i) {
              return h - d * scaling;
            },
            height: function(d, i) {
              return d * scaling;
            }
          })
          .on('mouseover', function(d) {
            // カスタムイベントをディスパッチする
            dispatch.call('customHover', this, d);
          })
          // ENTER + UPDATE領域
          .merge(bars)
          .transition(t)
          .attrs({
            width: barW,
            x: function(d, i) {
              return i * barW;
            },
            y: function(d, i) {
              return h - d * scaling;
            },
            height: function(d, i) {
              return d * scaling;
            }
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
        return w;
      }
      width = _;
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
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

    var barChart = d3iida.barChart()
      .width(500)
      .height(300)
      .on('customHover', function(d) {
        d3.select('#barChartMessage').text(d);
      });

    // 棒グラフのコンテナは<div id='barChar'>を使う
    var container = d3.select('#barChart');

    // このセレクションにデータを紐付けてcall()する
    container.datum(data).call(barChart);
    // container.call(barChart);


    // テスト。繰り返し実行して結果を観察する
    var doTest = true;
    var repeat = 0;
    var dataTimer;
    var widthTimer;

    // テスト用。データを更新する
    function updateData() {
      repeat++;
      if (repeat === 10) {
        clearInterval(dataTimer);
        clearInterval(widthTimer);
      }
      data = d3iida.utils.rndNumbers(50, 100);

      // セレクションに新しいdataを紐付けてcall()する
      container.datum(data).call(barChart);
    }

    // テスト用。チャートのパラメータ変更（幅）
    function updateWidth() {
      // widthとしてランダム値を使う
      var rnd = d3iida.utils.rndNum(100, 500);

      // チャート側のパラメータを変更して、再度セレクションでcall()
      container.call(barChart.width(rnd));
    }

    if (doTest) {
      dataTimer = setInterval(updateData, 1000);
      widthTimer = setInterval(updateWidth, 5000);
    }
    //
  };
  //
})();
