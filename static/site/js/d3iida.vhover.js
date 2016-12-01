/* global d3, d3iida */

// 2016.11.10
// Takamitsu IIDA

// クリックもドラッグも使わずにマウスホバーだけで数値を選択するモジュール
// データ数は10個程度が限界
// 年別の推移を見るときにちょうどいい

// ファイル名と名前空間は適当に変更して使うこと

(function() {
  //
  d3iida.vhover = function module(_accessor) {
    // svgを作る必要があるならインスタンス化するときにtrueを渡す
    // 例： var chart = sliderChart(true);
    var needsvg = arguments.length ? _accessor : false;

    // ダミーデータ
    var dummy = ['dummy'];

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

    // データのticksテキスト
    var CLASS_TRACK_TICKS = 'vh-track-ticks';

    // 巨大テキスト
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

    // 現在の値を表示する'text'へのセレクタ
    // 右揃えで配置
    var label;

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
          var svgAll = container.selectAll('svg').data(dummy);
          container = svgAll
            .enter()
            .append('svg')
            .merge(svgAll)
            .attr('width', width)
            .attr('height', height);
        }

        // レイヤ'g'を追加
        var baseLayerAll = container.selectAll('.' + CLASS_BASE_LAYER).data(dummy);
        var baseLayer = baseLayerAll
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
        var trackBackgroundAll = baseLayer.selectAll('.' + CLASS_TRACK_BACKGROUND).data(dummy);
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
          .on('touchmove', mousemove);

        // 次に置くのは内側を塗りつぶす太さ8pxのライン
        var trackInsetAll = baseLayer.selectAll('.' + CLASS_TRACK_INSET).data(dummy);
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

        // 目盛を表示する領域'g'を追加
        // スライダよりも20pxだけ右に、10px下にズラす
        var ticksLayerAll = baseLayer.selectAll('.' + CLASS_TRACK_TICKS).data(dummy);
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

        // 選択値を表示する巨大'text'
        var labelAll = baseLayer.selectAll('.' + CLASS_LABEL_TEXT).data(dummy);
        label = labelAll
          .enter()
          .append('text')
          .classed(CLASS_LABEL_TEXT, true)
          .merge(labelAll)
          .attr('text-anchor', 'start') // 右寄せするなら'end'を指定
          .attr('x', 80) // その場合の'x'は一番右側を指す w
          .attr('dy', '.55em')
          // .attr('class', 'year label') // セレクタに使うクラスと別のクラスを使うなら
          .text(data[0]);

        setCurrent(data[0]);
        //
      });
    }

    function mouseover() {
      label.classed('active', true);
    }

    function mouseout() {
      label.classed('active', false);
    }

    function mousemove() {
      var d = yScale.invert(d3.mouse(this)[1]);
      var yyyy = Math.round(d);
      if (current !== yyyy) {
        setCurrent(yyyy);
      }
    }

    function setCurrent(yyyy) {
      container.selectAll('.' + CLASS_TRACK_CIRCLE).each(function(d) {
        d3.select(this).classed('active', (d === yyyy));
      });

      current = yyyy;
      label.text(yyyy);

      // イベントを発行する
      dispatch.call('selectedIndexChanged', this, yyyy);
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

  //
  // 使い方
  //
  d3iida.vhover.example = function() {
    // データを用意する
    var minYear = 2009;
    var maxYear = 2016;
    var years = d3.range(minYear, maxYear + 1);

    // 単独で使う時はtrueを渡してsvgを作る
    var chart = d3iida.vhover(true);

    // コンテナのセレクションにデータを紐付けてcall()する
    d3.select('.chartContainer').datum(years).call(chart);

   //
  };

  //
})();
