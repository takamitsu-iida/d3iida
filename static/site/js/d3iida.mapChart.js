/* global d3, topojson, crossfilter, d3iida */

// 2016.11.01
// Takamitsu IIDA

// 依存関係
// topojson
// crossfilter
// d3iida.radioButton.js
// d3iida.simpleTable.js
// d3iida.tooltip.js
// d3iida.geodata.japan.js 日本地図のtopojsonデータ
// d3iida.geodata.prefectures.js 県庁所在地の地点データ

// 地図モジュール
(function() {
  d3iida.mapChart = function module() {
    // 一番上位のSVGを選択するセレクタ
    // call()時にセットされる
    var svg = d3.select(null);

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
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // カスタムイベントを登録する
    var dispatch = d3.dispatch('brushing');

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
        .enter()
        .append('a')
        .on('click', function(d) {
          // console.log(d);
          zoomToCity(d.id);
          container.select('.d3iida-control').selectAll('a').classed('active', false);
          d3.select(this).classed('active', true);
        })
        // .merge(aAll)
        .html(function(d) {
          return d.name;
        });

      aAll
        .html(function(d) {
          return d.name;
        });

      aAll
        .exit()
        .remove();

      // 先頭のリンクは、都市ではないので、クリック時にはズームをリセットする
      container.select('.d3iida-control')
        .select('a')
        .classed('active', true)
        .on('click', function(d) {
          // なぜか、このdが期待と違い、コンテナに紐付いたデータになってしまう
          // どのみちこの値は使わないのでよいのだが、バグなのか、ちょっと気になる
          resetZoom();
          container.select('.d3iida-control').selectAll('a').classed('active', false);
          d3.select(this).classed('active', true);
        });
      //
    }

    // 拠点の'circle'の半径
    var siteRadius = 5.0;

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

      // 新しいプロジェクションで拠点の位置を計算し直す
      svg.selectAll('.sites')
        .attr('cx', function(d) {
          return projection(d.geometry.coordinates)[0];
        })
        .attr('cy', function(d) {
          return projection(d.geometry.coordinates)[1];
        });

      // 新しいプロジェクションで拠点のラベル位置を計算し直す
      svg.selectAll('.sitesname')
        .attr('x', function(d) {
          return projection(d.geometry.coordinates)[0] + 6;
        })
        .attr('y', function(d) {
          return projection(d.geometry.coordinates)[1];
        })
        .attr('dy', '.35em');
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
        .attr('width', w)
        .attr('height', h)
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
    // call()されたときに呼ばれる公開関数
    //
    function exports(_selection) {
      _selection.each(function(_data) {
        var container = _selection;

        // コンテナにnullを紐付けてcall()したら、全て削除
        if (!_data) {
          container.selectAll('div').remove();
          container.selectAll('svg').remove();
          return;
        }

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
        var resetRectAll = container.select('svg').selectAll('.resetRect').data(['dummy']);
        resetRectAll
          .enter()
          .append('rect')
          .classed('resetRect', true)
          .style('fill', 'none')
          .style('pointer-events', 'all')
          .merge(resetRectAll)
          .on('click', resetZoom)
          .attr('width', width)
          .attr('height', height);

        // 地図を描画するレイヤ 'g'
        var mapLayerAll = container.select('svg').selectAll('.mapLayer').data(['dummy']);
        mapLayerAll
          .enter()
          .append('g')
          .classed('mapLayer', true)
          .merge(mapLayerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // mapLayerに県を描画するパスを追加
        container.select('.mapLayer').selectAll('.prefecture').data(features)
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

        // サイトを描画するレイヤ
        var siteLayerAll = container.select('svg').selectAll('.siteLayer').data(['dummy']);
        siteLayerAll
          .enter()
          .append('g')
          .classed('siteLayer', true)
          .merge(siteLayerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // siteLayerに拠点を追加
        var sitesAll = container.select('.siteLayer').selectAll('.sites').data(_data.features);
        sitesAll
          .enter()
          .append('circle')
          .classed('sites', true)
          .attr('r', siteRadius)
          .attr('cx', function(d) {
            return projection(d.geometry.coordinates)[0];
          })
          .attr('cy', function(d) {
            return projection(d.geometry.coordinates)[1];
          })
          .on('click', function(d) {
            console.log(d.properties.city);
          })
          .call(
            d3iida.tooltip(function(d, i) {
              return '<b>' + d.properties.city + '</b>';
            })
          );

        sitesAll
          .exit()
          .remove();

        var sitesnameAll = container.select('.siteLayer').selectAll('.sitesname').data(_data.features);
        sitesnameAll
          .enter()
          .append('text')
          .classed('sitesname', true)
          .merge(sitesnameAll)
          .text(function(d) {
            return d.properties.city;
          })
          .attr('x', function(d) {
            return projection(d.geometry.coordinates)[0] + 6;
          })
          .attr('y', function(d) {
            return projection(d.geometry.coordinates)[1];
          })
          .attr('dy', '.35em')
          .exit()
          .remove();

        // コンテナにブラシ制御用の<div>を作り、ラジオボタンをcall()する
        container.selectAll('#brushControl').data(['dummy'])
          .enter()
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

  // 使い方
  d3iida.mapChart.example = function() {
    // コンテナは<div id='mapChart'>として、ここに地図を描画する
    var mapContainer = d3.select('#mapChart');

    // コンテナの横幅を取り出して、それに合わせる
    var mapContainerWidth = mapContainer.node().clientWidth;

    // ブラシで選択した拠点を表示するコンテナ
    // <div id='siteTable'></div>
    var tableContainer = d3.select('#siteTable');

    // 県庁所在地のデータ
    var prefGovLoc = d3iida.geodata.prefectureGovernmentLocationMap;

    // 拠点をテーブル表示するモジュールsimpleTableをインスタンス化する
    var table = d3iida.simpleTable(function(rowObj) {
      // crossfilterでフィルタされた県庁所在地の配列の各行が渡されるので、
      // 適宜フィルタをして<td>タグで表示したいものだけを配列にして返却する

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
