/* global d3, d3iida */

// 2016.11.01
// Takamitsu IIDA
// takamitsu.iida@gmail.com

// simpleTableモジュール
(function() {
  d3iida.simpleTable = function module() {
    //
    // コンテナに紐付けられているデータ配列が[rowObj1, rowObj2, rowObj3, ...]として、
    // 各オブジェクトのなかから表示したい情報を配列にして返す関数
    // デフォルト動作は、オブジェクトに格納されているvalueの列挙。
    var rowFilter = function(rowObj) {
      return d3.values(rowObj);
    };

    function exports(_selection) {
      _selection.each(function(_data) {
        if (!_data) {
          d3.select(this).select('table').remove();
          return;
        }

        // ダミーデータを紐付けて初回call()時のみ<table>を作成する
        d3.select(this).selectAll('table').data(['dummy'])
          .enter()
          .append('table');

        var trAll = d3.select(this).select('table').selectAll('tr').data(_data);

        trAll
          // ENTER領域
          .enter()
          .append('tr')
          .selectAll('td')
          .data(function(row) {
            return rowFilter(row);
          })
          .enter()
          .append('td')
          .text(function(d) {
            return d;
          });

        trAll
          // EXIT領域
          .exit()
          .remove();

        trAll
          // UPDATE領域
          .selectAll('td')
          .data(function(row) {
            return rowFilter(row);
          })
          .text(function(d) {
            return d;
          });
        //
      });
    }

    exports.rowFilter = function(_) {
      if (!arguments.length) {
        return rowFilter;
      }
      rowFilter = _;
      return this;
    };

    return exports;
  };
  //
})();
