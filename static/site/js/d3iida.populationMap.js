/* global d3, topojson, d3iida */

// 2016.11.12
// Takamitsu IIDA

// 依存関係
// topojson
// d3iida.vhover.js
// d3iida.geodata.japan.js 日本地図のtopojsonデータ

// 地図モジュール
(function() {
  d3iida.populationMap = function module() {
    // 一番上位のSVGを選択するセレクタ
    // call()時にセットされる
    var svg = d3.select(null);

    // SVGの枠の大きさ
    var width = 600;
    var height = 480;

    // 'g'の描画領域となるデフォルトのマージン
    var margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    };

    // チャート描画領域のサイズw, h
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // クリックで移動可能な県
    var cities = [
      {
        id: 'all', name: '日本全域'
      },
      {
        id: 'hokkaido', name: '北海道'
      },
      {
        id: 'tokyo', name: '東京'
      },
      {
        id: 'aichi', name: '愛知'
      },
      {
        id: 'osaka', name: '大阪'
      },
      {
        id: 'fukuoka', name: '福岡'
      },
      {
        id: 'okinawa', name: '沖縄'
      }
    ];

    // クリックで都市に移動するためのリンクを追加する
    function initControls(container) {
      // <div class='d3iida-controls'></div>をひとつだけ作成する
      container.selectAll('.d3iida-controls').data(['dummy'])
        .enter()
        .append('div')
        .classed('d3iida-controls', true)
        .append('div')
        .classed('d3iida-control', true);

      // cities配列を紐付けた<a>を作成する
      var aAll = container.select('.d3iida-control').selectAll('a').data(cities);
      aAll
        // ENTER領域
        .enter()
        .append('a')
        .on('click', function(d) {
          // console.log(d);
          if (d.id === 'all') {
            resetZoom();
          } else {
            zoomToCity(d.id);
          }
          container.select('.d3iida-control').selectAll('a').classed('active', false);
          d3.select(this).classed('active', true);
        })
        // ENTER + UPDATE領域
        .merge(aAll)
        .html(function(d) {
          return d.name;
        })
        .select(function(d) {
          // idがallになっているものを選択状態にする
          if (d.id === 'all') {
            d3.select(this).classed('active', true);
          }
        });

      aAll
        .exit()
        .remove();
      //
    }

    // 地図の縮尺
    // 小さいほど広域が表示される
    // 画面サイズに合わせて調整が必要で、経験則的に決める必要がある
    var scaleSize = 40;

    // 日本地図のtopojsonデータ
    var geodata = d3iida.geodata.japan;

    // geodataから取り出したfeatures
    var features = topojson.feature(geodata, geodata.objects.japan).features;

    // メルカトル図法のプロジェクション関数
    var projection = d3.geoMercator()
      .scale(scaleSize)
      .translate([0, 0]);

    // プロジェクション関数を初期状態に戻す
    function initProjection() {
      projection
        .scale(scaleSize)
        .translate([0, 0]);
    }

    // 地図の中心点となる緯度経度
    // 経験則的に決めたもので、わりと適当
    var center = [139.0032936, 38.5139088];

    // プロジェクション関数を通して計算した地図の中心点の画面上の座標
    var centerPoint = projection(center);

    // 地図用のパスジェネレータ
    var geoPath = d3.geoPath().projection(projection);

    // d3.zoom()オブジェクト
    // scaleExtentは初期の縮尺の20倍まで拡大
    var zoom = d3.zoom().scaleExtent([scaleSize, scaleSize * 20]).on('zoom', onZoom);

    // ズームイベントのハンドラ
    function onZoom() {
      // イベントから座標と拡大値を取り出す
      var x = d3.event.transform.x;
      var y = d3.event.transform.y;
      var k = d3.event.transform.k;

      // プロジェクションをズームにあわせて変更する
      projection.translate([x, y]).scale(scaleSize * k);

      // 新しいプロジェクションでパスを生成し直す
      svg.selectAll('.prefecture').attr('d', geoPath);
    }

    // クリックで選択した県
    var activePrefecture = d3.select(null);

    // 県の境界線にあわせてズームする
    function zoomToBound(d) {
      // プロジェクション関数を初期状態に戻す
      initProjection();

      // 境界ボックスを取り出す
      var bounds = geoPath.bounds(d);

      // 境界ボックスの真ん中の座標をtranslate配列にする
      var x = (bounds[0][0] + bounds[1][0]) / 2;
      var y = (bounds[0][1] + bounds[1][1]) / 2;
      var centerBounds = [x, y];

      // 拡大するスケールを決める
      var dx = bounds[1][0] - bounds[0][0];
      var dy = bounds[1][1] - bounds[0][1];
      // var scale = 0.9 / Math.max(dx / w, dy / h);
      var scale = Math.max(1, Math.min(scaleSize * 20, 0.9 / Math.max(dx / w, dy / h)));

      svg
        .transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(scale).translate(-centerBounds[0], -centerBounds[1]));
    }

    // 都市名を指定してズーム
    function zoomToCity(city) {
      var d = features.filter(function(d) {
        return d.properties.name.toLowerCase() === city;
      })[0];
      if (d !== undefined && d !== null) {
        zoomToBound(d);
      }
    }

    function resetZoom() {
      // プロジェクション関数を初期状態に戻す
      initProjection();

      activePrefecture.classed('active', false);
      activePrefecture = d3.select(null);

      // 位置を中心に戻す
      svg
        .transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(scaleSize).translate(-centerPoint[0], -centerPoint[1]));
    }

    // call()元のコンテナ
    var container;

    // call()元が持っているデータ
    var data;

    //
    // call()されたときに呼ばれる公開関数
    //
    function exports(_selection) {
      container = _selection;
      _selection.each(function(_data) {
        // コンテナにnullを紐付けてcall()したら、全て削除
        if (!_data) {
          container.selectAll('div').remove();
          container.selectAll('svg').remove();
          return;
        }

        // 渡されたデータをインスタンス変数に保存
        data = _data;

        // 都市選択用のHTMLを追加する
        initControls(container);

        // svgを一つ作成する
        var svgAll = container.selectAll('svg').data(['dummy']);
        svgAll
          // ENTER領域
          .enter()
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .attr('preserveAspectRatio', 'xMinYMin meet')
          .attr('viewBox', '0 0 ' + width + ' ' + height)
          .style('overflow', 'hidden')
          // 背景を海の色にするにはこのスタイルを有効にする。ただし、とても見づらい
          // .style('background', '#90D1FF')
          .classed('svg-content-responsive', true)
          .on('click', function() {
            // これがないと移動やズーム動作でクリックが発動してしまう
            if (d3.event.defaultPrevented) {
              d3.event.stopPropagation();
            }
            // console.log('svg clicked');
          }, true)
          // ズーム処理は最上位のsvgに設定するとよい
          .call(zoom)
          // 地図外をクリックしたときにズームをリセットするイベントを仕込んでいるため
          // ダブルクリックでのズームと相性が悪い
          .on('dblclick.zoom', null); // ダブルクリックでのズームをやめる場合はnullを指定
          // .on('wheel.zoom', null) // マウスホイールでのズームをやめる場合はnullを指定
          // .on('mousedown.zoom', null) // ドラッグでの移動（パン動作）をやめる場合はnullを指定

        svgAll
          // UPDATE領域
          .attr('width', width)
          .attr('height', height);

        // 最上位のsvgを選択するセレクタ
        // exports()の外側の関数でsvgを操作するのに必要
        svg = container.select('svg');

        // ズームイベントを発動して、中心位置に移動する
        svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(scaleSize).translate(-centerPoint[0], -centerPoint[1]));

        // レイヤを順番に作成
        // スタイルの指定はCSSファイルを見ること
        // 特に pointer-events:を指定するかどうかで、マウスイベントを拾うかどうかを制御している

        // ズーム動作をリセットするための'rect'を追加する
        var resetLayerAll = svg.selectAll('.pm-reset-layer').data(['dummy']);
        resetLayerAll
          .enter()
          .append('rect')
          .classed('pm-reset-layer', true)
          .style('fill', 'none')
          .style('pointer-events', 'all')
          .merge(resetLayerAll)
          .on('click', resetZoom)
          .attr('width', width)
          .attr('height', height);

        // 地図を描画するレイヤ 'g'
        var mapLayerAll = svg.selectAll('.pm-map-layer').data(['dummy']);
        var mapLayer = mapLayerAll
          .enter()
          .append('g')
          .classed('pm-map-layer', true)
          .merge(mapLayerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // mapLayerに県を描画するパスを追加
        mapLayer.selectAll('.prefecture').data(features)
          .enter()
          .append('path')
          .attr('d', geoPath)
          .attr('class', function(d) {
            return 'prefecture ' + d.properties.name;
          })
          .on('click', function(d) {
            // console.log(d.properties.name_local);
            if (activePrefecture.node() === this) {
              resetZoom();
              return;
            }
            activePrefecture.classed('active', false);
            activePrefecture = d3.select(this).classed('active', true);
            zoomToBound(d);
            if (d3.event.defaultPrevented) d3.event.stopPropagation();
          });

        init_vhover();

        init_legend();

        //
      });
    }

    // vhoverモジュールのインスタンス
    var vhover = d3iida.vhover2().height(h - 40);

    // vhoverで選択する際のレンジ
    var vhoverRange = [2001, 2010];

    vhover.on('selectedIndexChanged', function(d) {
      setColorByYear(d);
    });

    function init_vhover() {
      // vhoverを配置するレイヤ 'g'
      var vhoverLayerAll = svg.selectAll('.pm-vhover-layer').data(['dummy']);
      var vhoverLayer = vhoverLayerAll
        .enter()
        .append('g')
        .classed('pm-vhover-layer', true)
        .merge(vhoverLayerAll)
        .attr('transform', 'translate(0, 40)');

      // データを紐付けてcall()する
      vhoverLayer.datum(vhoverRange).call(vhover);
    }

    // 凡例に表示するバーの幅と高さ
    var legendBarWidth = 300;
    var legendBarHeight = 8; // これがd3.jsのticksのデフォルト値

    var domain = [-1.2, -0.9, -0.6, -0.3, 0.0, 0.3, 0.6, 0.9, 1.2];
    var color = d3.scaleThreshold()
        .domain(domain)
        .range(d3.schemeBrBG[domain.length]);

    var xScale = d3.scaleLinear()
        .domain([-1.2, 1.2])
        .range([0, legendBarWidth]);

    function init_legend() {
      // 凡例のレイヤ
      // 位置は適当に調整
      var legendLayerAll = svg.selectAll('.pm-legend-layer').data(['dummy']);
      var legendLayer = legendLayerAll
        .enter()
        .append('g')
        .classed('pm-legend-layer', true)
        .merge(legendLayerAll)
        .attr('transform', 'translate(' + (w - legendBarWidth) + ',' + (h - legendBarHeight) + ')');

      var rectAll = legendLayer
        .selectAll('rect')
        .data(color.range().map(function(d) {
          d = color.invertExtent(d);
          // 最初と最後はundefiedになるので、補正する
          if (d[0] === null || d[0] === undefined) d[0] = xScale.domain()[0];
          if (d[1] === null || d[1] === undefined) d[1] = xScale.domain()[1];
          return d;
        }));

      rectAll
        .enter()
        .append('rect')
        .merge(rectAll)
        .attr('x', function(d) {
          return xScale(d[0]);
        })
        .attr('width', function(d) {
          return xScale(d[1]) - xScale(d[0]);
        })
        .attr('height', legendBarHeight)
        .attr('fill', function(d) {
          return color(d[0]);
        });

      rectAll
        .exit()
        .remove();

      var labelAll = legendLayer.selectAll('text').data(['人口増加率']);
      labelAll
        .enter()
        .append('text')
        .merge(labelAll)
        .attr('fill', '#000')
        .attr('x', xScale.range()[0])
        .attr('y', -10)
        .attr('text-anchor', 'start')
        .text(function(d) {
          return d;
        });

      legendLayer
        .call(d3.axisBottom(xScale)
        .tickSize(domain.length)
        .tickValues(color.domain()))
        .select('.domain')
        .remove();
      //
    }

    function setColorByYear(year) {
      container
        .selectAll('.prefecture')
        .style('fill', function(d) {
          var properties = d.properties;
          var name = properties.name; // 県名がローマ字で入っている
          var rate = getRateByNameAndYear(name, year);
          if (rate !== undefined) {
            return color(rate);
          }
          console.log(name);
          console.log(year);
          return 'black';
        });
    }

    function getRateByNameAndYear(name, year) {
      var rate;
      var i;
      for (i = 0; i < data.length; i++) {
        var d = data[i];
        if (d.name === name) {
          var index = year - vhoverRange[0];
          if (index >= 0 && index < d.rates.length) {
            rate = d.rates[index];
            break;
          }
        }
      }
      return rate;
    }

    //
    // クロージャ
    //

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      projection.translate([w / 2, h / 2]);
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      projection.translate([w / 2, h / 2]);
      vhover.height(h - 40);
      return this;
    };

    exports.center = function(_) {
      if (!arguments.length) {
        return center;
      }
      center = _;
      return this;
    };

    exports.scaleSize = function(_) {
      if (!arguments.length) {
        return scaleSize;
      }
      scaleSize = _;
      return this;
    };

    // vhover用
    exports.vhoverRange = function(_) {
      if (!arguments.length) {
        return vhoverRange;
      }
      vhoverRange = _;
      return this;
    };

    return exports;
  };

  // 使い方
  d3iida.populationMap.example = function() {
    // コンテナは<div id='mapChart'>として、ここに地図を描画する
    var mapContainer = d3.select('#mapChart');

    // コンテナの横幅を取り出して、それに合わせる
    var mapContainerWidth = mapContainer.node().clientWidth;

    // データを用意する
    var minYear = 2001;
    var maxYear = 2010;
    var years = d3.range(minYear, maxYear + 1);

    // データ
    var rates = d3iida.populationMap.ratesOfPopulationChangeByPrefecturesFrom2001To2010;

    // インスタンス化する
    var map = d3iida.populationMap().width(mapContainerWidth).vhoverRange(years);

    // コンテナにデータを紐付けてcall()する
    mapContainer.datum(rates).call(map);
   //
  };
  //
})();

//
// 以下、データ
//

// 出典：「人口推計」（総務省統計局）
// 人口推計 長期時系列データ 長期時系列データ（平成12年～22年）
// http://www.e-stat.go.jp/SG1/estat/List.do?bid=000001039703&cycode=0
//
(function() {
  d3iida.populationMap.ratesOfPopulationChangeByPrefecturesFrom2001To2010 = [
    {id: '01', name: 'Hokkaido', name_local: '北海道', rates: [-0.05, -0.14, -0.17, -0.23, -0.39, -0.40, -0.47, -0.55, -0.44, -0.31]},
    {id: '02', name: 'Aomori', name_local: '青森県', rates: [-0.18, -0.41, -0.56, -0.71, -0.81, -0.90, -1.01, -0.99, -0.85, -0.73]},
    {id: '03', name: 'Iwate', name_local: '岩手県', rates: [-0.20, -0.42, -0.42, -0.49, -0.68, -0.73, -0.79, -0.89, -0.87, -0.74]},
    {id: '04', name: 'Miyagi', name_local: '宮城県', rates: [0.17, -0.02, 0.01, -0.11, -0.26, -0.11, -0.18, -0.18, -0.07, 0.02]},
    {id: '05', name: 'Akita', name_local: '秋田県', rates: [-0.51, -0.69, -0.81, -0.79, -0.93, -1.00, -1.14, -1.12, -1.08, -0.97]},
    {id: '06', name: 'Yamagata', name_local: '山形県', rates: [-0.27, -0.42, -0.43, -0.53, -0.62, -0.72, -0.77, -0.86, -0.82, -0.79]},
    {id: '07', name: 'Fukushima', name_local: '福島県', rates: [-0.13, -0.30, -0.36, -0.40, -0.49, -0.53, -0.61, -0.66, -0.60, -0.61]},
    {id: '08', name: 'Ibaraki', name_local: '茨城県', rates: [0.14, -0.11, -0.04, -0.13, -0.22, -0.04, -0.02, -0.08, -0.05, 0.00]},
    {id: '09', name: 'Tochigi', name_local: '栃木県', rates: [0.32, 0.03, 0.10, 0.13, 0.01, -0.01, -0.01, -0.06, -0.20, -0.16]},
    {id: '10', name: 'Gunma', name_local: '群馬県', rates: [0.22, 0.02, 0.00, -0.11, -0.16, -0.09, -0.13, -0.12, -0.18, -0.28]},
    {id: '11', name: 'Saitama', name_local: '埼玉県', rates: [0.57, 0.33, 0.40, 0.25, 0.12, 0.35, 0.38, 0.42, 0.35, 0.46]},
    {id: '12', name: 'Chiba', name_local: '千葉県', rates: [0.74, 0.47, 0.53, 0.28, 0.16, 0.45, 0.57, 0.56, 0.44, 0.59]},
    {id: '13', name: 'Tokyo', name_local: '東京都', rates: [0.83, 0.87, 0.96, 0.76, 0.75, 1.01, 1.14, 0.97, 0.58, 0.85]},
    {id: '14', name: 'Kanagawa', name_local: '神奈川県', rates: [1.00, 0.70, 0.76, 0.59, 0.44, 0.62, 0.75, 0.59, 0.47, 0.47]},
    {id: '15', name: 'Niigata', name_local: '新潟県', rates: [-0.20, -0.35, -0.30, -0.40, -0.55, -0.47, -0.49, -0.50, -0.47, -0.43]},
    {id: '16', name: 'Toyama', name_local: '富山県', rates: [-0.04, -0.18, -0.21, -0.13, -0.25, -0.11, -0.34, -0.35, -0.49, -0.39]},
    {id: '17', name: 'Ishikawa', name_local: '石川県', rates: [0.08, -0.15, -0.05, -0.15, -0.31, -0.09, -0.02, -0.06, -0.14, -0.06]},
    {id: '18', name: 'Fukui', name_local: '福井県', rates: [0.08, -0.22, -0.13, -0.29, -0.33, -0.24, -0.33, -0.38, -0.51, -0.41]},
    {id: '19', name: 'Yamanashi', name_local: '山梨県', rates: [0.22, -0.08, -0.18, -0.17, -0.21, -0.48, -0.40, -0.70, -0.43, -0.44]},
    {id: '20', name: 'Nagano', name_local: '長野県', rates: [0.31, -0.33, -0.19, -0.21, -0.44, -0.30, -0.35, -0.42, -0.49, -0.45]},
    {id: '21', name: 'Gifu', name_local: '岐阜県', rates: [0.15, -0.05, 0.01, -0.10, -0.03, -0.11, -0.06, -0.18, -0.42, -0.50]},
    {id: '22', name: 'Shizuoka', name_local: '静岡県', rates: [0.33, 0.11, 0.15, 0.03, 0.04, 0.07, 0.03, -0.08, -0.27, -0.46]},
    {id: '23', name: 'Aichi', name_local: '愛知県', rates: [0.68, 0.56, 0.54, 0.54, 0.64, 0.72, 0.69, 0.57, 0.17, -0.01]},
    {id: '24', name: 'Mie', name_local: '三重県', rates: [0.26, 0.03, 0.09, 0.12, 0.02, 0.24, 0.09, -0.11, -0.37, -0.51]},
    {id: '25', name: 'Shiga', name_local: '滋賀県', rates: [0.82, 0.50, 0.55, 0.47, 0.42, 0.68, 0.58, 0.49, 0.28, 0.16]},
    {id: '26', name: 'Kyoto', name_local: '京都府', rates: [0.17, -0.03, 0.07, 0.02, -0.10, -0.05, -0.13, -0.10, -0.12, -0.03]},
    {id: '27', name: 'Osaka', name_local: '大阪府', rates: [0.18, 0.00, 0.04, 0.01, -0.09, 0.13, 0.12, 0.09, 0.09, 0.12]},
    {id: '28', name: 'Hyogo', name_local: '兵庫県', rates: [0.38, 0.15, 0.15, 0.06, -0.02, 0.03, 0.01, -0.01, -0.03, -0.04]},
    {id: '29', name: 'Nara', name_local: '奈良県', rates: [-0.08, -0.34, -0.19, -0.40, -0.49, -0.31, -0.30, -0.36, -0.25, -0.22]},
    {id: '30', name: 'Wakayama', name_local: '和歌山県', rates: [-0.44, -0.60, -0.65, -0.65, -0.87, -0.68, -0.77, -0.69, -0.62, -0.55]},
    {id: '31', name: 'Tottori', name_local: '鳥取県', rates: [0.01, -0.15, -0.18, -0.23, -0.48, -0.42, -0.63, -0.72, -0.70, -0.59]},
    {id: '32', name: 'Shimane', name_local: '島根県', rates: [-0.15, -0.57, -0.49, -0.67, -0.68, -0.66, -0.64, -0.73, -0.83, -0.52]},
    {id: '33', name: 'Okayama', name_local: '岡山県', rates: [0.18, 0.08, 0.11, 0.03, -0.07, -0.05, -0.02, -0.13, -0.25, -0.17]},
    {id: '34', name: 'Hiroshima', name_local: '広島県', rates: [0.03, -0.05, 0.04, -0.03, -0.07, -0.06, -0.03, -0.15, -0.19, -0.13]},
    {id: '35', name: 'Yamaguchi', name_local: '山口県', rates: [-0.30, -0.43, -0.43, -0.54, -0.64, -0.55, -0.58, -0.64, -0.49, -0.53]},
    {id: '36', name: 'Tokushima', name_local: '徳島県', rates: [-0.21, -0.25, -0.33, -0.44, -0.50, -0.55, -0.65, -0.70, -0.59, -0.56]},
    {id: '37', name: 'Kagawa', name_local: '香川県', rates: [-0.10, -0.23, -0.15, -0.23, -0.33, -0.32, -0.33, -0.31, -0.34, -0.35]},
    {id: '38', name: 'Ehime', name_local: '愛媛県', rates: [-0.20, -0.35, -0.27, -0.43, -0.46, -0.50, -0.52, -0.52, -0.52, -0.44]},
    {id: '39', name: 'Kochi', name_local: '高知県', rates: [-0.19, -0.34, -0.46, -0.49, -0.71, -0.79, -0.92, -0.97, -0.83, -0.56]},
    {id: '40', name: 'Fukuoka', name_local: '福岡県', rates: [0.29, 0.18, 0.12, 0.10, -0.00, 0.14, 0.08, 0.02, 0.03, 0.16]},
    {id: '41', name: 'Saga', name_local: '佐賀県', rates: [-0.05, -0.28, -0.19, -0.28, -0.38, -0.40, -0.38, -0.38, -0.42, -0.35]},
    {id: '42', name: 'Nagasaki', name_local: '長崎県', rates: [-0.29, -0.50, -0.47, -0.50, -0.77, -0.76, -0.82, -0.85, -0.66, -0.48]},
    {id: '43', name: 'Kumamoto', name_local: '熊本県', rates: [0.02, -0.16, -0.23, -0.21, -0.34, -0.22, -0.36, -0.28, -0.30, -0.19]},
    {id: '44', name: 'Oita', name_local: '大分県', rates: [-0.06, -0.11, -0.18, -0.22, -0.37, -0.21, -0.10, -0.12, -0.34, -0.31]},
    {id: '45', name: 'Miyazaki', name_local: '宮崎県', rates: [-0.18, -0.25, -0.24, -0.29, -0.50, -0.30, -0.34, -0.43, -0.28, -0.21]},
    {id: '46', name: 'Kagoshima', name_local: '鹿児島県', rates: [-0.26, -0.31, -0.34, -0.40, -0.56, -0.52, -0.65, -0.69, -0.50, -0.34]},
    {id: '47', name: 'Okinawa', name_local: '沖縄県', rates: [0.68, 0.66, 0.66, 0.64, 0.61, 0.55, 0.40, 0.25, 0.50, 0.58]}
  ];
  //
})();
