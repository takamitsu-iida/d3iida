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
        // callのたびに<table>を作りなおす
        d3.select(this).select('table').remove();

        var table = d3.select(this).append('table');
        var tbody = table.append('tbody');

        // 行を作成
        tbody.selectAll('tr')
          .data(_data)
          .enter()
          .append('tr') // trタグ追加
          .selectAll('td')
          .data(function(row) {
            return rowFilter(row);
          })
          .enter()
          .append('td') // tdタグ追加
          .text(function(d) {
            return d; // d.value;
          });
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
