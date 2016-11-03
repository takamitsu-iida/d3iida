/* global d3, d3iida */

// 2016.11.02
// Takamitsu IIDA
// takamitsu.iida@gmail.com

// 使い方
// d3iida.simpleTable(function(row) {
//   この関数が_accessorになる
//   return [row.prop1, row.prop2];
// });

// simpleTableモジュール
(function() {
  d3iida.simpleTable = function module(_accessor) {
    // _accessor関数は、
    // コンテナに紐付けられているデータ配列が[rowObj1, rowObj2, rowObj3, ...]であるとして、
    // 各オブジェクトのなかから表示したい情報を配列にして返す関数

    // _accessor関数が指定されなかった場合は、
    // オブジェクトに格納されているvalueを列挙する
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
            if (_accessor) {
              return _accessor(row);
            }
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
            if (_accessor) {
              return _accessor(row);
            }
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
