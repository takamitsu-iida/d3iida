/* global d3, crossfilter, d3iida */

// crossfilterに依存しているので読み込むこと
//  <!-- crossfilterをインクルード -->
//  <script src="./static/crossfilter-1.3.12/crossfilter.min.js"></script>

// データマネージャモジュール
(function() {
  d3iida.dataManager = function module() {
    // このモジュールで保持しているデータ
    var data;

    // このモジュールは関数ではなくマップを返す
    var exports = {};

    // カスタムイベント。
    var dispatch = d3.dispatch('geoReady', 'dataReady', 'dataLoading');

    // CSVを読み、データ整形する。
    exports.loadCsvData = function(_file, _cleaningFunc) {
      // d3.csv()でCSVファイルを要求する。ローカルファイルは読めないのでサーバが必要。
      var loadCsv = d3.csv(_file);

      // d3.csv()が発行するprogressイベントをカスタムイベントdataLoadingとして発火させる
      loadCsv.on('progress', function() {
        // カスタムイベントをディスパッチする
        dispatch.call('dataLoading', this, d3.event.loaded);
      });

      // HTTP GETで取得。非同期処理。
      loadCsv.get(function(_err, _response) {
        // _cleaningFuncで渡された関数を実行してデータを整形する
        _response.forEach(function(d) {
          _cleaningFunc(d);
        });

        // dataに整形後のデータを格納する
        data = _response;

        // 読み込んだCSVデータをCrossfilterに渡すならここで処理。
        // dataCrossfilter.add(_response);
        // ディメンジョン定義。データ内のLOCATIONを渡す。
        // location = dataCrossfilter.dimension(function(d) {
        //   return d.LOCATION;
        // });

        // カスタムイベント dataReady を発火させる。
        dispatch.call('dataReady', this, _response);
      });
    };

    // 外部からデータを取得するための公開関数
    exports.getData = function() {
      return data;
    };

    // 位置でフィルタするcrossfilter()
    var siteCrossfilter = crossfilter();

    // crossfilterのディメンジョン定義用の変数。
    var siteLocation;

    // geojsonファイルを読み終えたらコールバックを呼ぶ公開関数
    exports.loadGeoJson = function(_file, _callback) {
      d3.json(_file, function(_err, _data) {
        if (_data.type === 'FeatureCollection') {
          // 拠点データと考えて、クロスフィルターをセットアップする
          siteCrossfilter.add(_data.features);
          // ディメンジョン定義。データ内の座標を渡す。
          siteLocation = siteCrossfilter.dimension(function(d) {
            return d.geometry.coordinates;
          });
        }

        _callback(_data);

        // カスタムイベント geoReady を発火させる。
        dispatch.call('geoReady', this, _data);
      });
    };

    // Crossfilterのサイズを返す公開関数
    exports.getSiteCrossfilterSize = function() {
      return siteCrossfilter.size();
    };

    // siteLocationによってフィルタをした結果を返す公開関数
    exports.filterSiteLocation = function(_locationArea) {
      if (!siteLocation) {
        return [];
      }

      // 境界ボックスからlongitudeの配列にする
      var longitudes = [_locationArea[0][0], _locationArea[1][0]];

      // 境界ボックスからlatitudeの配列にする
      var latitudes = [_locationArea[0][1], _locationArea[1][1]];

      siteLocation.filterFunction(function(d) {
        return d[0] >= longitudes[0] &&
          d[0] <= longitudes[1] &&
          d[1] >= latitudes[0] &&
          d[1] <= latitudes[1];
      });

      // 境界ボックスに収まる全レコード返す
      return siteLocation.top(Infinity);
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
  //
})();
