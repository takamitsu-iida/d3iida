/* global d3iida */

(function() {
  // idと県名を対応付けるマップ
  d3iida.geodata.prefIdMap = {
    '01': '北海道',
    '02': '青森県',
    '03': '岩手県',
    '04': '宮城県',
    '05': '秋田県',
    '06': '山形県',
    '07': '福島県',
    '08': '茨城県',
    '09': '栃木県',
    '10': '群馬県',
    '11': '埼玉県',
    '12': '千葉県',
    '13': '東京都',
    '14': '神奈川県',
    '15': '新潟県',
    '16': '富山県',
    '17': '石川県',
    '18': '福井県',
    '19': '山梨県',
    '20': '長野県',
    '21': '岐阜県',
    '22': '静岡県',
    '23': '愛知県',
    '24': '三重県',
    '25': '滋賀県',
    '26': '京都府',
    '27': '大阪府',
    '28': '兵庫県',
    '29': '奈良県',
    '30': '和歌山県',
    '31': '鳥取県',
    '32': '島根県',
    '33': '岡山県',
    '34': '広島県',
    '35': '山口県',
    '36': '徳島県',
    '37': '香川県',
    '38': '愛媛県',
    '39': '高知県',
    '40': '福岡県',
    '41': '佐賀県',
    '42': '長崎県',
    '43': '熊本県',
    '44': '大分県',
    '45': '宮崎県',
    '46': '鹿児島県',
    '47': '沖縄県'
  };

  // x軸向きのデータの数がいくつあるのかを調べる
  d3iida.geodata.prefectureGovernmentLocationMap = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: '01', // '01': '北海道',
        geometry: {
          type: 'Point',
          coordinates: [141.347899, 43.063968]
        },
        properties: {
          city: '札幌'
        }
      },
      {
        type: 'Feature',
        id: '02', // '02': '青森県',
        geometry: {
          type: 'Point',
          coordinates: [140.740593, 40.824623]
        },
        properties: {
          city: '青森'
        }
      },
      {
        type: 'Feature',
        id: '03', // '03': '岩手県',
        geometry: {
          type: 'Point',
          coordinates: [141.152667, 39.703531]
        },
        properties: {
          city: '盛岡'
        }
      },
      {
        type: 'Feature',
        id: '04', // '04': '宮城県',
        geometry: {
          type: 'Point',
          coordinates: [140.872103, 38.268839]
        },
        properties: {
          city: '仙台'
        }
      },
      {
        type: 'Feature',
        id: '05', // '05': '秋田県',
        geometry: {
          type: 'Point',
          coordinates: [140.102415, 39.718635]
        },
        properties: {
          city: '秋田'
        }
      },
      {
        type: 'Feature',
        id: '06', // '06': '山形県',
        geometry: {
          type: 'Point',
          coordinates: [140.363634, 38.240437]
        },
        properties: {
          city: '山形'
        }
      },
      {
        type: 'Feature',
        id: '07', // '07': '福島県',
        geometry: {
          type: 'Point',
          coordinates: [140.467521, 37.750299]
        },
        properties: {
          city: '福島'
        }
      },
      {
        type: 'Feature',
        id: '08', // '08': '茨城県',
        geometry: {
          type: 'Point',
          coordinates: [140.446793, 36.341813]
        },
        properties: {
          city: '水戸'
        }
      },
      {
        type: 'Feature',
        id: '09', // '09': '栃木県',
        geometry: {
          type: 'Point',
          coordinates: [139.883565, 36.565725]
        },
        properties: {
          city: '宇都宮'
        }
      },
      {
        type: 'Feature',
        id: '10', // '10': '群馬県',
        geometry: {
          type: 'Point',
          coordinates: [139.060848, 36.391251]
        },
        properties: {
          city: '前橋'
        }
      },
      {
        type: 'Feature',
        id: '11', // '11': '埼玉県',
        geometry: {
          type: 'Point',
          coordinates: [139.648933, 35.857428]
        },
        properties: {
          city: 'さいたま'
        }
      },
      {
        type: 'Feature',
        id: '12', // '12': '千葉県',
        geometry: {
          type: 'Point',
          coordinates: [140.123308, 35.605058]
        },
        properties: {
          city: '千葉'
        }
      },
      {
        type: 'Feature',
        id: '13', // '13': '東京都',
        geometry: {
          type: 'Point',
          coordinates: [139.691704, 35.689521]
        },
        properties: {
          city: '東京'
        }
      },
      {
        type: 'Feature',
        id: '14', // '14': '神奈川県',
        geometry: {
          type: 'Point',
          coordinates: [139.642514, 35.447753]
        },
        properties: {
          city: '横浜'
        }
      },
      {
        type: 'Feature',
        id: '15', // '15': '新潟県',
        geometry: {
          type: 'Point',
          coordinates: [139.023221, 37.902418]
        },
        properties: {
          city: '新潟'
        }
      },
      {
        type: 'Feature',
        id: '16', // '16': '富山県',
        geometry: {
          type: 'Point',
          coordinates: [137.211338, 36.695290]
        },
        properties: {
          city: '富山'
        }
      },
      {
        type: 'Feature',
        id: '17', // '17': '石川県',
        geometry: {
          type: 'Point',
          coordinates: [136.625573, 36.594682]
        },
        properties: {
          city: '金沢'
        }
      },
      {
        type: 'Feature',
        id: '18', // '18': '福井県',
        geometry: {
          type: 'Point',
          coordinates: [136.221642, 36.065219]
        },
        properties: {
          city: '福井'
        }
      },
      {
        type: 'Feature',
        id: '19', // '19': '山梨県',
        geometry: {
          type: 'Point',
          coordinates: [138.568449, 35.664158]
        },
        properties: {
          city: '甲府'
        }
      },
      {
        type: 'Feature',
        id: '20', // '20': '長野県',
        geometry: {
          type: 'Point',
          coordinates: [138.181224, 36.651289]
        },
        properties: {
          city: '長野'
        }
      },
      {
        type: 'Feature',
        id: '21', // '21': '岐阜県',
        geometry: {
          type: 'Point',
          coordinates: [136.722291, 35.391227]
        },
        properties: {
          city: '岐阜'
        }
      },
      {
        type: 'Feature',
        id: '22', // '22': '静岡県',
        geometry: {
          type: 'Point',
          coordinates: [138.383054, 34.976978]
        },
        properties: {
          city: '静岡'
        }
      },
      {
        type: 'Feature',
        id: '23', // '23': '愛知県',
        geometry: {
          type: 'Point',
          coordinates: [136.906565, 35.180188]
        },
        properties: {
          city: '名古屋'
        }
      },
      {
        type: 'Feature',
        id: '24', // '24': '三重県',
        geometry: {
          type: 'Point',
          coordinates: [136.508591, 34.730283]
        },
        properties: {
          city: '津'
        }
      },
      {
        type: 'Feature',
        id: '25', // '25': '滋賀県',
        geometry: {
          type: 'Point',
          coordinates: [135.868590, 35.004531]
        },
        properties: {
          city: '大津'
        }
      },
      {
        type: 'Feature',
        id: '26', // '26': '京都府',
        geometry: {
          type: 'Point',
          coordinates: [135.755481, 35.021365]
        },
        properties: {
          city: '京都'
        }
      },
      {
        type: 'Feature',
        id: '27', // '27': '大阪府',
        geometry: {
          type: 'Point',
          coordinates: [135.519661, 34.686297]
        },
        properties: {
          city: '大阪'
        }
      },
      {
        type: 'Feature',
        id: '28', // '28': '兵庫県',
        geometry: {
          type: 'Point',
          coordinates: [135.183025, 34.691279]
        },
        properties: {
          city: '神戸'
        }
      },
      {
        type: 'Feature',
        id: '29', // '29': '奈良県',
        geometry: {
          type: 'Point',
          coordinates: [135.832744, 34.685333]
        },
        properties: {
          city: '奈良'
        }
      },
      {
        type: 'Feature',
        id: '30', // '30': '和歌山県',
        geometry: {
          type: 'Point',
          coordinates: [135.167506, 34.226034]
        },
        properties: {
          city: '和歌山'
        }
      },
      {
        type: 'Feature',
        id: '31', // '31': '鳥取県',
        geometry: {
          type: 'Point',
          coordinates: [134.237672, 35.503869]
        },
        properties: {
          city: '鳥取'
        }
      },
      {
        type: 'Feature',
        id: '32', // '32': '島根県',
        geometry: {
          type: 'Point',
          coordinates: [133.050499, 35.472297]
        },
        properties: {
          city: '松江'
        }
      },
      {
        type: 'Feature',
        id: '33', // '33': '岡山県',
        geometry: {
          type: 'Point',
          coordinates: [133.934407, 34.661755]
        },
        properties: {
          city: '岡山'
        }
      },
      {
        type: 'Feature',
        id: '34', // '34': '広島県',
        geometry: {
          type: 'Point',
          coordinates: [132.459622, 34.396560]
        },
        properties: {
          city: '広島'
        }
      },
      {
        type: 'Feature',
        id: '35', // '35': '山口県',
        geometry: {
          type: 'Point',
          coordinates: [131.470500, 34.186121]
        },
        properties: {
          city: '山口'
        }
      },
      {
        type: 'Feature',
        id: '36', // '36': '徳島県',
        geometry: {
          type: 'Point',
          coordinates: [134.559279, 34.065761]
        },
        properties: {
          city: '徳島'
        }
      },
      {
        type: 'Feature',
        id: '37', // '37': '香川県',
        geometry: {
          type: 'Point',
          coordinates: [134.043444, 34.340149]
        },
        properties: {
          city: '高松'
        }
      },
      {
        type: 'Feature',
        id: '38', // '38': '愛媛県',
        geometry: {
          type: 'Point',
          coordinates: [132.765362, 33.841660]
        },
        properties: {
          city: '松山'
        }
      },
      {
        type: 'Feature',
        id: '39', // '39': '高知県',
        geometry: {
          type: 'Point',
          coordinates: [133.531080, 33.559705]
        },
        properties: {
          city: '高知'
        }
      },
      {
        type: 'Feature',
        id: '40', // '40': '福岡県',
        geometry: {
          type: 'Point',
          coordinates: [130.418314, 33.606785]
        },
        properties: {
          city: '福岡'
        }
      },
      {
        type: 'Feature',
        id: '41', // '41': '佐賀県',
        geometry: {
          type: 'Point',
          coordinates: [130.298822, 33.249367]
        },
        properties: {
          city: '佐賀'
        }
      },
      {
        type: 'Feature',
        id: '42', // '42': '長崎県',
        geometry: {
          type: 'Point',
          coordinates: [129.873756, 32.744839]
        },
        properties: {
          city: '長崎'
        }
      },
      {
        type: 'Feature',
        id: '43', // '43': '熊本県',
        geometry: {
          type: 'Point',
          coordinates: [130.741667, 32.789828]
        },
        properties: {
          city: '熊本'
        }
      },
      {
        type: 'Feature',
        id: '44', // '44': '大分県',
        geometry: {
          type: 'Point',
          coordinates: [131.612591, 33.238194]
        },
        properties: {
          city: '大分'
        }
      },
      {
        type: 'Feature',
        id: '45', // '45': '宮崎県',
        geometry: {
          type: 'Point',
          coordinates: [131.423855, 31.911090]
        },
        properties: {
          city: '宮崎'
        }
      },
      {
        type: 'Feature',
        id: '46', // '46': '鹿児島県',
        geometry: {
          type: 'Point',
          coordinates: [130.557981, 31.560148]
        },
        properties: {
          city: '鹿児島'
        }
      },
      {
        type: 'Feature',
        id: '47', // '47': '沖縄県'
        geometry: {
          type: 'Point',
          coordinates: [127.680932, 26.212401]
        },
        properties: {
          city: '那覇'
        }
      }
    ]
  };
  //
})();
