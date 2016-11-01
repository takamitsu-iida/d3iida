/* global d3, topojson, crossfilter, d3iida */

// 2016.11.01
// Takamitsu IIDA
// takamitsu.iida@gmail.com

// 依存関係
// topojson
// crossfilter
// d3iida.radioButton.js
// d3iida.simpleTable.js
// d3iida.geodata.japan.js 日本地図のtopojsonデータ
// d3iida.geodata.prefectures.js 県庁所在地の地点データ

// 地図モジュール
(function() {
  d3iida.mapChart = function module() {
    // 一番上位のSVG
    var svg;

    // SVGの枠の大きさ
    var width = 600;
    var height = 400;

    // 'g'の描画領域となるデフォルトのマージン
    var margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    };

    // チャート描画領域のサイズw, h
    // 軸や凡例がはみ出てしまうので、マージンの分だけ小さくしておく。
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // カスタムイベントを登録する
    var dispatch = d3.dispatch('brushing');

    // 拠点の'circle'の半径
    var siteRadius = 4.0;

    // 地図の縮尺
    // 小さいほど広域が表示される
    // 画面サイズと合わせて調整が必要で、経験則的に決める必要がある
    var scaleSize = 35;

    // 日本地図のtopojsonデータ
    var geodata = d3iida.geodata.japan;

    // geodataから取り出したfeatures
    var features = topojson.feature(geodata, geodata.objects.japan).features;

    // メルカトル図法のプロジェクション関数
    var projection = d3.geoMercator()
      .scale(scaleSize)
      .translate([0, 0]);
      // .center(center) // center()は最初にcall()するときに決定するので指定しない

    // 地図の中心点
    var center = [139.0032936, 38.5139088];

    // projectionで変換した初期センター値
    var centerPoint = projection(center);

    // 地図用のパスジェネレータ
    var geoPath = d3.geoPath().projection(projection);

    // ズームイベントのハンドラ
    function onZoom() {
      // ブラシで領域を指定するので、projectionを変更する
      var k = d3.event.transform.k;
      var x = d3.event.transform.x;
      var y = d3.event.transform.y;
      projection.translate([x, y]).scale(scaleSize * k);

      // 新しいprojectionでパスを生成し直す
      svg.selectAll('.prefecture').attr('d', geoPath);

      // 新しいprojectionで位置を計算し直す
      svg.selectAll('.sites')
        .attr('cx', function(d) {
          return projection(d.geometry.coordinates)[0];
        })
        .attr('cy', function(d) {
          return projection(d.geometry.coordinates)[1];
        });

      /*
       * 単純に移動・拡大するだけでよければ、これで事足りる
       *
      // 県のパスを移動・拡大する
      svg.selectAll('.prefecture')
        .attr('transform', d3.event.transform)
        .style('stroke-width', 1.0 / d3.event.transform.k + 'px');

      // 拠点のcircleを移動・拡大する
      svg.selectAll('.sites')
        .attr('transform', d3.event.transform)
        .style('stroke-width', 1.0 / d3.event.transform.k + 'px')
        .attr('r', function() {
          var r = siteRadius / d3.event.transform.k;
          return d3.max([r, 0.8]);
        });
      */
    }

    // d3.zoom()オブジェクト
    // scaleExtentに指定する大きさは、経験上の数字で、根拠はない
    var zoom = d3.zoom().scaleExtent([scaleSize, scaleSize * 10]).on('zoom', onZoom);

    // brushの有効・無効
    var isBrushEnabled = false;

    // ブラシのレイヤを追加・削除
    function toggleBrush() {
      isBrushEnabled = !isBrushEnabled;
      if (!isBrushEnabled) {
        svg.selectAll('.brushLayer').remove();
        return;
      }

      // レイヤを新規作成
      // 紐付けるデータはENTER領域を作るためのダミーなので、なんでもよい
      svg.selectAll('.brushLayer').data(['dummy']).enter()
        .append('g')
        .attr('width', w).attr('height', h)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .classed('brushLayer', true)
        .call(d3.brush().extent([[0, 0], [w, h]]).on('brush', function() {
          if (!d3.event.sourceEvent) return; // Only transition after input.
          if (!d3.event.selection) return; // Ignore empty selections.
          var extents = d3.event.selection.map(projection.invert);
          dispatch.call('brushing', this, extents);
        }));
    }

    // ラジオボタンを使ってブラシの有効・無効を制御する
    var brushControlData = [
      // d3iida.radioButtonで必要なキーはlabelとindex
      {
        index: 0,
        label: 'パン'
      },
      {
        index: 1,
        label: 'ブラシ'
      }
    ];
    var brushControl = d3iida.radioButton();
    brushControl
      .title('マウス動作')
      .selectedIndex(0)
      .on('selectedIndexChanged', function(selectedIndex) {
        if (selectedIndex === 0) {
          if (isBrushEnabled) {
            toggleBrush();
          }
        } else if (selectedIndex === 1) {
          if (!isBrushEnabled) {
            toggleBrush();
          }
        }
      });

    //
    //
    // call()されたときに呼ばれる公開関数
    //
    function exports(_selection) {
      _selection.each(function(_data) {
        // svgを作成する
        var svgAll = d3.select(this).selectAll('svg').data([_data]);

        // ENTER領域
        svg = svgAll.enter()
          .append('svg')
          .attr('width', width).attr('height', height)
          .attr('preserveAspectRatio', 'xMinYMin meet')
          .attr('viewBox', '0 0 ' + width + ' ' + height)
          .style('overflow', 'hidden')
          .classed('svg-content-responsive', true);

        // ズーム処理は一番上のsvgに設定するとよい
        svg.call(zoom);
        svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(scaleSize).translate(-centerPoint[0], -centerPoint[1]));

        // svg.on('dblclick.zoom', null);  // ダブルクリックでのズームをやめる場合はnullを指定
        // svg.on('wheel.zoom', null);  // マウスホイールでのズームをやめる場合はnullを指定
        // svg.on('mousedown.zoom', null);  // ドラッグでの移動（パン動作）をやめる場合はnullを指定

        // レイヤを順番に作成

        // 地図を描画するレイヤ 'g'
        // CSSファイルも見ること
        var mapLayer = svg.append('g')
          .attr('width', w).attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
          .classed('mapLayer', true);

        // mapLayerに県を描画するパスを追加
        // CSSファイルも見ること
        // pointer-events     : all;
        mapLayer.selectAll('.prefecture').data(features).enter()
          .append('path')
          .attr('d', geoPath)
          .attr('class', function(d) {
            return 'prefecture ' + d.properties.name;
          })
          .on('click', function(d) {
            console.log(d.properties.name_local);
          });

        // サイトの円を描画するレイヤ 'g'
        var siteLayer = svg.append('g')
          .attr('width', w).attr('height', h).attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
          .classed('siteLayer', true);

        // siteLayerに拠点の円を追加
        // CSSファイルも見ること
        siteLayer.selectAll('.sites').data(_data.features).enter()
          .append('circle')
          .attr('cx', function(d) {
            return projection(d.geometry.coordinates)[0];
          })
          .attr('cy', function(d) {
            return projection(d.geometry.coordinates)[1];
          })
          .attr('r', siteRadius)
          .attr('class', 'sites')
          .on('mouseover', function(d) {
            console.log(d.properties.city);
          });

        // コンテナにブラシ制御用の新しいDIVを作り、そこにブラシ制御用のSVGを追加する
        d3.select(this).selectAll('#brushControl').data(['dummy']).enter()
          .append('div')
          .attr('id', 'brushControl')
          .datum(brushControlData)
          .call(brushControl);
        //
      });
    }

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

    exports.isBrushEnabled = function(_) {
      if (!arguments.length) {
        return isBrushEnabled;
      }
      if (isBrushEnabled === _) {
        // 値に変化がないなら、何もしない
        return this;
      }
      toggleBrush();
      return this;
    };

    exports.toggleBrush = function() {
      toggleBrush();
      console.log('brush is now ' + isBrushEnabled);
      return this;
    };

    exports.siteRadius = function(_) {
      if (!arguments.length) {
        return siteRadius;
      }
      siteRadius = _;
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

  // 使い方  <div id='mapChart'></div>内に地図を描画する
  d3iida.mapChart.example = function() {
    // <div id='mapChart'></div>
    var mapContainer = d3.select('#mapChart');
    var mapContainerWidth = mapContainer.node().clientWidth;

    // <div id='siteTable'></div>
    var tableContainer = d3.select('#siteTable');

    // 県庁所在地のデータ
    var prefGovLoc = d3iida.geodata.prefectureGovernmentLocationMap;

    // 拠点をテーブル表示するモジュールsimpleTableをインスタンス化する
    // crossfilterでフィルタされた県庁所在地の配列が渡される
    var table = d3iida.simpleTable();

    // tableに載せたいデータを配列で返却する関数
    table.rowFilter(function(rowObj) {
      // console.log(rowObj);
      // データ構造はd3iida.geodata.prefectures.jsを見れば分かる
      // {
      //   type: 'Feature',
      //   id: '01', // '01': '北海道',
      //   geometry: {
      //     type: 'Point',
      //     coordinates: [141.347899, 43.063968]
      //   },
      //   properties: {
      //     city: '札幌'
      //   }
      // },

      // <td>タグで表示したい情報だけを配列で返す
      return [rowObj.id, rowObj.properties.city];
    });

    // crossfilterのディメンジョン定義
    var siteLocation = crossfilter().add(prefGovLoc.features).dimension(function(d) {
      return d.geometry.coordinates;
    });

    // mapChartをインスタンス化する
    var mapChart = d3iida.mapChart().width(mapContainerWidth).height(480);

    // ブラシイベントを拾って、境界に収まる拠点の配列を計算する
    mapChart.on('brushing', function(extents) {
      // 境界ボックスからlongitudeの配列にする
      var longitudes = [extents[0][0], extents[1][0]];

      // 境界ボックスからlatitudeの配列にする
      var latitudes = [extents[0][1], extents[1][1]];

      // フィルタ関数を設定する
      siteLocation.filterFunction(function(d) {
        return d[0] >= longitudes[0] && d[0] <= longitudes[1] && d[1] >= latitudes[1] && d[1] <= latitudes[0];
      });

      // 境界ボックスに収まる全レコードを得る
      var filteredLocations = siteLocation.top(Infinity);

      // 新しいデータを紐付けてテーブルをcall()する
      tableContainer.datum(filteredLocations).call(table);
    });

    // コンテナに県庁所在地データを紐付けてcall()する
    mapContainer.datum(prefGovLoc).call(mapChart);
   //
  };
  //
})();
