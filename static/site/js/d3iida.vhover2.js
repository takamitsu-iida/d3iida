/* global d3, d3iida */

// 2016.11.14
// Takamitsu IIDA

// メモ
// https://bost.ocks.org/mike/nations/

// クリックもドラッグも使わずにマウスホバーだけで数値を選択するモジュール
// データ数は10個程度が限界
// 年別の推移を見るときにちょうどいい

// ファイル名と名前空間は適当に変更して使うこと

(function() {
  //
  d3iida.vhover2 = function module(_accessor) {
    // svgを作る必要があるならインスタンス化するときにtrueを渡す
    // 例： var chart = sliderChart(true);
    var needsvg = arguments.length ? _accessor : false;

    //
    // CSSクラス名定義
    //

    // 一番下のレイヤ
    var CLASS_BASE_LAYER = 'vh-base-layer';

    // マウスイベントを処理する見えない極太ライン
    var CLASS_TRACK_BACKGROUND = 'vh-track-background';

    // 縦の塗りつぶしライン
    var CLASS_TRACK_INSET = 'vh-track-inset';

    // データのticksに相当する丸
    var CLASS_TRACK_CIRCLE = 'vh-track-circle';

    // 選択中の物を表す丸
    var CLASS_FOCUS_LAYER = 'vh-focus-layer';
    var CLASS_FOCUS_INSET = 'vh-focus-inset';
    var CLASS_FOCUS_OUTLINE = 'vh-focus-outline';

    // データのticksテキスト
    var CLASS_TRACK_TICKS = 'vh-track-ticks';

    // 巨大テキストを配置するレイヤ'g'
    var CLASS_LABEL_LAYER = 'vh-label-layer';

    // 巨大テキスト'text'
    var CLASS_LABEL_TEXT = 'vh-label-text';

    // 外枠の大きさ
    var width = 450;
    var height = 450;

    // 60pxの極太ラインを描画するので、その半分の30pxは必ずズラす
    // 描画領域のマージン
    var margin = {
      top: 35,
      right: 0,
      bottom: 35,
      left: 35
    };

    // 描画領域のサイズw, h
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // 現在の値
    var current = 0;

    // ベースレイヤへのセレクタ。トランジションはここに仕込む
    var baseLayer;

    // 選択中のものを示すfocusへのセレクタ
    var focus;

    // 現在の値を表示する'text'へのセレクタ
    // 右揃えで配置
    var label;

    // トランジション用のパラメータ
    var minValue;
    var maxValue;
    var duration = 10000;

    // スケール関数と出力レンジ指定
    var yScale = d3.scaleLinear().range([0, h]).clamp(true);

    // ドメイン指定は、データ入手後にsetDomain()で行う
    var ydomain;

    // データの最小値・最大値を調べて入力ドメインを設定する
    function setDomain(data) {
      if (!ydomain) {
        var yextent = d3.extent(data, function(d) {
          return d;
        });
        yScale.domain(yextent);

        // トランジション用のパラメータをセットする
        minValue = yextent[0];
        maxValue = yextent[1];
      }
    }

    // カスタムイベント
    var dispatch = d3.dispatch('selectedIndexChanged');

    // このモジュールをcall()したセレクション
    var container;

    // セレクションに紐付けられたデータ
    var data;

    // 公開関数
    function exports(_selection) {
      container = _selection;
      _selection.each(function(_data) {
        data = _data;

        if (!_data) {
          // データにnullを指定してcall()した場合は、既存の描画領域を削除して終了
          container.select('.' + CLASS_BASE_LAYER).remove();
          return;
        }

        // 受け取ったデータで入力ドメインを設定
        setDomain(data);

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

        // レイヤ'g'を追加
        var baseLayerAll = container.selectAll('.' + CLASS_BASE_LAYER).data(['dummy']);
        baseLayer = baseLayerAll
          // ENTER領域
          .enter()
          .append('g')
          .classed(CLASS_BASE_LAYER, true)
          // ENTER + UPDATE領域
          .merge(baseLayerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // 下に置くものから順に積み上げていく

        // 一番下は太さ60pxの極太ライン
        // マウスイベントはここで処理する
        var trackBackgroundAll = baseLayer.selectAll('.' + CLASS_TRACK_BACKGROUND).data(['dummy']);
        trackBackgroundAll
          .enter()
          .append('line')
          .classed(CLASS_TRACK_BACKGROUND, true)
          .merge(trackBackgroundAll)
          .attr('y1', yScale.range()[0])
          .attr('y2', yScale.range()[1])
          .on('mouseover', mouseover)
          .on('mouseout', mouseout)
          .on('mousemove', mousemove)
          .on('touchmove', mousemove)
          .on('click', mouseclick);

        // 次に置くのは内側を塗りつぶす太さ8pxのライン
        var trackInsetAll = baseLayer.selectAll('.' + CLASS_TRACK_INSET).data(['dummy']);
        trackInsetAll
          .enter()
          .append('line')
          .classed(CLASS_TRACK_INSET, true)
          .merge(trackInsetAll)
          .attr('y1', yScale.range()[0])
          .attr('y2', yScale.range()[1]);

        // 次に置くのは丸
        var trackCircleAll = baseLayer.selectAll('.' + CLASS_TRACK_CIRCLE).data(data);
        trackCircleAll
          .enter()
          .append('circle')
          .classed(CLASS_TRACK_CIRCLE, true)
          .merge(trackCircleAll)
          .attr('r', 12)
          .attr('cx', 0)
          .attr('cy', function(d) {
            return yScale(d);
          });

        // 選択中のものに付与するfocus
        var focusLayerAll = baseLayer.selectAll('.' + CLASS_FOCUS_LAYER).data(['dummy']);
        focus = focusLayerAll
          .enter()
          .append('g')
          .classed(CLASS_FOCUS_LAYER, true)
          .merge(focusLayerAll)
          .attr('x', 0)
          .attr('y', 0);

        var focusInsetAll = focus.selectAll('.' + CLASS_FOCUS_INSET).data(['dummy']);
        focusInsetAll
          .enter()
          .append('circle')
          .classed(CLASS_FOCUS_INSET, true)
          .merge(focusInsetAll)
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', 12);

        var focusOutlineAll = focus.selectAll('.' + CLASS_FOCUS_OUTLINE).data(['dummy']);
        focusOutlineAll
          .enter()
          .append('circle')
          .classed(CLASS_FOCUS_OUTLINE, true)
          .merge(focusOutlineAll)
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', 14);

        // 目盛を表示する領域'g'を追加
        // スライダよりも20pxだけ右に、10px下にズラす
        var ticksLayerAll = baseLayer.selectAll('.' + CLASS_TRACK_TICKS).data(['dummy']);
        var ticksLayer = ticksLayerAll
          // ENTER領域
          .enter()
          .append('g')
          .classed(CLASS_TRACK_TICKS, true)
          // ENTER + UPDATE領域
          .merge(ticksLayerAll)
          .attr('transform', 'translate(20,10)');

        // 目盛になるテキスト
        var ticksTextAll = ticksLayer.selectAll('text').data(yScale.ticks(data.length - 1));
        ticksTextAll
          // ENTER領域
          .enter()
          .append('text')
          // ENTER + UPDATE領域
          .merge(ticksTextAll)
          .attr('y', yScale)
          .attr('text-anchor', 'left')
          .text(function(d) {
            return d || '';
          });

        ticksTextAll
          // EXIT領域
          .exit()
          .remove();

        // 選択値を表示する巨大'text'を配置するためのコンテナ 'g' を作り、80px右にズラす
        // 軸のticksのフォントサイズ、文字数によって調整すべし
        var labelLayerAll = baseLayer.selectAll('.' + CLASS_LABEL_LAYER).data(['dummy']);
        var labelLayer = labelLayerAll
          .enter()
          .append('g')
          .classed(CLASS_LABEL_LAYER, true)
          .merge(labelLayerAll)
          .attr('transform', 'translate(80,0)');

        var labelAll = labelLayer.selectAll('.' + CLASS_LABEL_TEXT).data([data[0]]);
        label = labelAll
          .enter()
          .append('text')
          .classed(CLASS_LABEL_TEXT, true)
          .text(function(d) {
            return d;
          })
          .merge(labelAll)
          .attr('text-anchor', 'start') // 右寄せするなら'end'を指定
          .attr('dy', '.55em');

        setCurrent(data[0]);

        pause();
        //
      });
    }

    function mouseover() {
      if (baseLayer.node().__transition) {
        label.classed('active', false);
        return;
      }
      label.classed('active', true);
    }

    function mouseout() {
      if (baseLayer.node().__transition) {
        label.classed('active', false);
        return;
      }
      label.classed('active', false);
    }

    function mousemove() {
      if (baseLayer.node().__transition) {
        // トランジションが動作中なら、何もしない
        return;
      }
      var d = yScale.invert(d3.mouse(this)[1]);
      var yyyy = Math.round(d);
      if (current !== yyyy) {
        setCurrent(yyyy);
      }
    }

    function setCurrent(yyyy) {
      current = yyyy;
      label.text(yyyy);

      container
        .selectAll('.' + CLASS_TRACK_CIRCLE)
        .filter(function(d) {
          return d === yyyy;
        })
        .select(function(d) {
          var y = d3.select(this).attr('cy');
          focus.attr('transform', 'translate(0,' + y + ')');
        });

      // イベントを発行する
      dispatch.call('selectedIndexChanged', this, current);
    }

    function mouseclick() {
      pause();
    }

    function pause() {
      // コンテナに仕込んでいるトランジションが動いているなら、それを停止して、処理完了
      if (baseLayer.node().__transition) {
        // スライダのトランジションを停止
        baseLayer.interrupt();
        focus.selectAll('circle').classed('transition', false);
        return;
      }

      // 最後まで行っているなら最初に巻き戻す
      if (current === yScale.domain()[1]) {
        setCurrent(minValue);
      }

      // 現在位置から計算して、残り時間がどのくらいかを計算してトランジションを作成する
      var t = d3.transition()
        .duration((maxValue - current) / (maxValue - minValue) * duration)
        .ease(d3.easeLinear);

      focus.selectAll('circle').classed('transition', true);

      // トランジションをかける
      baseLayer
        .transition(t)
        .tween('vhover2', function() {
          var i = d3.interpolate(current, maxValue);
          return function(d) {
            var yyyy = Math.floor(i(d)); // round(i(d));
            if (current !== yyyy) {
              setCurrent(yyyy);
            }
            if (yyyy === maxValue) {
              // console.log('最大値に到達しました');
              focus.selectAll('circle').classed('transition', false);
            }
          };
        });
    }

    //
    // クロージャ
    //

    exports.on = function() {
      var value = dispatch.on.apply(dispatch, arguments);
      return value === dispatch ? exports : value;
    };

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

      // スケール関数の出力レンジを補正する
      yScale.range([0, h]);
      return this;
    };

    return exports;
  };

  // svgの簡易ボタンモジュール
  d3iida.vhover2.ssbutton = function module(_accessor) {
    var CLASS_BUTTON_RECT = 'vh2-ssbutton';
    var CLASS_BUTTON_TEXT = 'vh2-ssbutton-text';

    // 表示テキスト
    var text = '開始';

    // テキストと外枠の'rect'までのスペース
    var padding = 10;

    // rectの角を曲げるときの半径
    var radius = 3;

    // カスタムイベントを登録する
    var dispatch = d3.dispatch('click');

    // このモジュールをcall()したセレクション
    var container;

    // 公開関数
    function exports(_selection) {
      container = _selection;

      // コンテナにテキストをのせる
      var ssbuttonTextAll = container.selectAll('.' + CLASS_BUTTON_TEXT).data(['dummy']);
      var ssbuttonText = ssbuttonTextAll
        .enter()
        .append('text')
        .classed(CLASS_BUTTON_TEXT, true)
        .merge(ssbuttonTextAll)
        .text(text);

      // テキストの境界ボックスを取り出す
      var bbox = ssbuttonText.node().getBBox();

      // ボタンとなる'rectをテキストの前に挿入する
      var ssbuttonAll = container.selectAll('.' + CLASS_BUTTON_RECT).data(['dummy']);
      ssbuttonAll
        .enter()
        .insert('rect', '.' + CLASS_BUTTON_TEXT)
        .classed(CLASS_BUTTON_RECT, true)
        .on('click', function(d) {
          dispatch.call('click', this, d);
        })
        .merge(ssbuttonAll)
        .attr('x', bbox.x - padding)
        .attr('y', bbox.y - padding)
        .attr('width', bbox.width + 2 * padding)
        .attr('height', bbox.height + 2 * padding)
        .attr('rx', radius)
        .attr('ry, radius');

      //
    }

    exports.text = function(_) {
      if (!arguments.length) {
        return text;
      }
      text = _;
      if (container) {
        container.select('.' + CLASS_BUTTON_TEXT).text(text);
      }
      return this;
    };

    exports.on = function() {
      var value = dispatch.on.apply(dispatch, arguments);
      return value === dispatch ? exports : value;
    };

    return exports;
    //
  };

  //
  // 使い方
  //
  d3iida.vhover2.example = function() {
    // データを用意する
    var minYear = 2009;
    var maxYear = 2016;
    var years = d3.range(minYear, maxYear + 1);

    // 単独で使う時はtrueを渡してsvgを作る
    var chart = d3iida.vhover2(true);

    // コンテナのセレクションにデータを紐付けてcall()する
    d3.select('.chartContainer').datum(years).call(chart);

   //
  };

  //
})();
