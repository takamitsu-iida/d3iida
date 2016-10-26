/* global d3, crossfilter, d3iida */

// グローバルに独自の名前空間を定義する
(function() {
  // このthisはグローバル空間
  this.d3iida = this.d3iida || (function() {
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

// データマネージャモジュール
(function() {
  d3iida.dataManager = function module() {
    // このモジュールで保持しているデータ
    var data;

    // 関数ではなくマップを返す
    var exports = {};

    // カスタムイベント。
    var dispatch = d3.dispatch('geoReady', 'dataReady', 'dataLoading');

    // 拠点の位置でフィルタするcrossfilter()
    var siteCrossfilter = crossfilter();

    // crossfilterのディメンジョン定義用の変数。
    var siteLocation;

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

    // 文字列からデータにする
    exports.loadSeaTemperatureFromString = function(_string) {
      // 想定しているデータ。先頭に空白が入るかもしれない。
      /*
      計測時刻  水深1m  水深5m
      23:00  18.01  17.95
      22:00  18.00  17.97
      21:00  18.06  18.02
      20:00  18.08  18.08
      19:00  18.12  18.09
      18:00  18.16  18.15
      17:00  18.19  18.17
      16:00  18.25  18.21
      15:00  18.26  18.10
      14:00  18.00  17.89
      13:00  18.19  17.80
      12:00  17.94  17.70
      11:00  18.07  17.20
      10:00  17.88  17.20
      09:00  17.82  17.24
      08:00  17.69  17.45
      07:00  17.75  17.77
      06:00  17.85  17.84
      05:00  17.82  17.78
      04:00  17.69  17.71
      03:00  17.69  17.71
      02:00  17.84  17.83
      01:00  17.75  17.77
      00:00  17.88  17.91
      */

      /*
        名前とデータ配列を格納したオブジェクトの配列にする
        [ { name: depth1m, values: [] },
          { name: depth5m, values: [] }, ... ]

        values配列はグラフ化するために(x,y)のペアになるようにする
        [ { date:..., temperature:... },
          { date:..., temeprature:... }, ... ]
      */

      // 時刻の書式
      var parseDate = d3.timeParse('%H:%M');

      // ここで使うキーの一覧
      var dataKeys = ['date', '水深1m', '水深5m'];

      // 各行のオブジェクト配列
      var lineDatas = [];

      // 改行で分割して配列にする
      var lines = _string.split(/\r\n|\r|\n/);
      // console.log(lines);

      // 各行の中身を正規表現で分割してオブジェクト化する
      // 元のテキストデータは23時始まりで、行と共に時間が古くなっていくので逆順に処理する
      var i;
      for (i = lines.length - 1; i > 0; i--) {
        var l = lines[i];
        var matches = l.match(/(\d+:00)\s+(\d{1,2}\.\d{1,2})\s+(\d{1,2}\.\d{1,2})/);
        if (!matches || matches.length !== 4) {
          continue;
        }

        // dataKeysをキーにしたオブジェクト(連想配列)に収める
        var v = {};
        v[dataKeys[0]] = parseDate(matches[1]);
        v[dataKeys[1]] = matches[2];
        v[dataKeys[2]] = matches[3];

        // それをlineDatas配列に追加していく
        lineDatas.push(v);
      }

      // Array.map()は配列の各要素について関数を適用して新たな配列を返す。
      // ['水深1m', '水深5m']の部分はdataKeys.slice()でもいいし、dataKeys.mapでdateを除外してもいい。
      data = ['水深1m', '水深5m'].map(function(k) {
        return {
          name: k,
          values: lineDatas.map(function(d) { // dはlineDatasの行
            return {
              date: d['date'], // d.date
              temperature: Number(d[k]) // d.'depth1m' or d.'depth5m'
            };
          })
        };
      });

      // カスタムイベント dataReady を発火させる。
      dispatch.call('dataReady', this);
    };

    // 外部からデータを取得するための公開関数
    exports.getData = function() {
      return data;
    };

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

// モジュール化の動作確認
// helloモジュール
(function() {
  d3iida.hello = function module() {
    // プライベート変数
    // クロージャで外から設定できるようにする
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
          .style('font-size', fontSize + 'px')
          .style('color', fontColor)
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
