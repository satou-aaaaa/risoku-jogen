// 利息の上限の問題を作る（ブラウザと node の両方で使う）。
// 中身は、利息制限法 第1〜7条の条文（下の SRC。e-Gov 法令検索で 2026-11-17 に読んだ。2010-06-18 施行の版）に書いてあることだけ。
// 1問は、お金を借りる場面を見て、法律どおりの答え（上限の利率・超えた分・天引き・みなし利息・遅れたときの損害金）を選ぶ。正解したら2段目「これは、どの決まり？」を選ぶ。
// 出資法の罰則・貸金業法・過払い金の請求・一人ずつの事情の判断は答えにしない。
// 人の名前・金額は作り話。乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。
// KINDS・言い回しの並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  const LAW = "https://laws.e-gov.go.jp/law/329AC0000000100";

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    r1: ["利息制限法 第1条（利息の制限）", LAW],
    r2: ["利息制限法 第2条（利息の天引き）", LAW],
    r3: ["利息制限法 第3条（みなし利息）", LAW],
    r4: ["利息制限法 第4条（賠償額の予定の制限）", LAW],
    r5: ["利息制限法 第5条（元本額の特則）", LAW],
    r6: ["利息制限法 第6条（みなし利息の特則）", LAW],
    r7: ["利息制限法 第7条（賠償額の予定の特則）", LAW],
  };

  // 2段目「これは、どの決まり？」の5つ
  const GROUPS = {
    ritsu: { name: "上限の利率", sub: "20%・18%・15%・合わせた元本" },
    keisan: { name: "上限を超えた分", sub: "1年分・月数・無効な部分" },
    tenbiki: { name: "天引き", sub: "先に引かれた利息" },
    minashi: { name: "みなし利息", sub: "手数料・礼金・費用" },
    songai: { name: "遅れたときの損害金", sub: "1.46倍・業者は20%・違約金" },
  };
  const GRP_WHY = {
    ritsu: "利息の上限は、元本が10万円未満は年20%、10万円以上100万円未満は年18%、100万円以上は年15%です（第1条）。業者から重ねて借りると元本を合わせて決めます（第5条）。",
    keisan: "上限の利率で計算した金額を超える利息の約束は、その超えた部分が無効です（第1条）。",
    tenbiki: "利息を先に引いたときは、受け取った額を元本として上限を計算し、超えた分は元本の支払いに充てたとみなします（第2条）。",
    minashi: "手数料・礼金・調査料など、貸す人が受け取る元本以外のお金は、名前にかかわらず利息とみなします（第3条）。契約や返すための費用は別です。",
    songai: "遅れたときの賠償の約束は、上限の利率の1.46倍まで（第4条）。業者が貸したときは年20%までです（第7条）。違約金も賠償の約束とみなします。",
  };

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end
  const MEDIA = { ritsu: "上限は？", keisan: "超えた分", tenbiki: "天引き", minashi: "手数料も？", songai: "遅れたら" };
  const WHO = ["Aさん", "Bさん", "Cさん", "Dさん"];
  const FROM = ["知人", "友人", "親せき", "会社の先輩"];
  const nOpt = (lv) => (lv === 0 ? 3 : 4);
  function choose(R, lv, ans, pool) {
    const wrong = pickN(R, [...new Set(pool)].filter((x) => x !== ans), nOpt(lv) - 1);
    return shuffle(R, [ans, ...wrong]);
  }
  // 金額は「〇万〇〇〇〇円」で出す（10000円未満は「〇〇円」）
  const man = (n) => (n >= 10000 ? `${Math.floor(n / 10000)}万${n % 10000 ? n % 10000 : ""}円` : `${n}円`);
  const capOf = (x) => (x < 100000 ? 20 : x < 1000000 ? 18 : 15);
  const pct = (h) => `年${h / 100}%`; // h は 0.01% きざみの整数
  const AMT = [30000, 50000, 80000, 200000, 300000, 500000, 800000, 1500000, 2000000, 3000000, 5000000];
  const pick = (R, a) => a[ri(R, 0, a.length - 1)];
  const KINDS = [];
  const K = (id, lv, grp, media, name, look, key, why, src, make) => KINDS.push({ id, lv, grp, media, name, look, key, why, src, make });
  const RATES = ["年20%", "年18%", "年15%", "年10%", "年25%", "年29.2%"];

  // ---- やさしい ----
  K("kubun", 0, "ritsu", "ritsu", "元本で決まる上限", "10万円・100万円が分かれ目です。", "上限は、元本10万円未満は年20%、100万円未満は年18%、100万円以上は年15%です。",
    "利息の契約は、元本10万円未満は年2割、10万円以上100万円未満は年1割8分、100万円以上は年1割5分を超える部分が無効です（利息制限法 第1条）。", ["r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, AMT), ans = `年${capOf(x)}%`, o = choose(R, lv, ans, RATES);
      return { q: `${WHO[w]}は${FROM[f]}から${man(x)}を借りる。利息制限法で、利息の上限は年何%？`, opts: o, ans, v: `${x}.${f}.${w}:${o.join(".")}`, a: { x } }; });
  K("koeru", 0, "ritsu", "ritsu", "その利率は上限を超える？", "まず元本で上限を決めます。", "元本で上限（20%・18%・15%）を決めて、約束の利率と比べます。",
    "元本の額に応じた利率（年2割・年1割8分・年1割5分）で計算した金額を超える利息の約束は、超えた部分が無効です（利息制限法 第1条）。", ["r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, AMT), r = pick(R, [10, 12, 14, 15, 16, 18, 19, 20, 22, 25, 30]), ans = r > capOf(x) ? "上限を超える" : "上限の中",
        o = choose(R, lv, ans, ["上限を超える", "上限の中", "借りる人が決める", "利率に上限はない"]);
      return { q: `${WHO[w]}は${FROM[f]}から${man(x)}を年${r}%の利息で借りる約束をした。この利率は？`, opts: o, ans, v: `${x}.${r}.${f}.${w}:${o.join(".")}`, a: { x, r } }; });
  K("muko", 0, "keisan", "keisan", "超えた部分だけ無効", "約束が全部なくなるわけではありません。", "上限を超える利息の約束は、超えた部分だけが無効です。借りたお金は返します。",
    "利息の契約は、上限の利率で計算した金額を超えるときは、その超過部分について無効とします（利息制限法 第1条）。", ["r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, AMT), r = capOf(x) + pick(R, [2, 5, 7, 10, 12]), ans = "上限を超える部分だけ無効",
        o = choose(R, lv, ans, ["約束がすべて無効", "借りたお金を返さなくてよい", "約束どおり全部払う", "利息が0円になる"]);
      return { q: `${WHO[w]}は${FROM[f]}から${man(x)}を年${r}%の利息で借りる約束をした。利息の約束はどうなる？`, opts: o, ans, v: `${x}.${r}.${f}.${w}:${o.join(".")}`, a: { x, r } }; });
  const FEE = ["手数料", "礼金", "調査料", "割引金"];
  K("tesuryo", 0, "minashi", "minashi", "手数料も利息とみなす", "名前が利息でなくても、利息です。", "手数料・礼金・調査料など、貸す人が受け取る元本以外のお金は、名前にかかわらず利息とみなします。",
    "債権者の受ける元本以外の金銭は、礼金、割引金、手数料、調査料その他いかなる名義をもってするかを問わず、利息とみなします（利息制限法 第3条）。", ["r3"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), n = ri(R, 0, 3), x = pick(R, AMT), fee = pick(R, [3000, 5000, 10000, 20000]), ans = "利息とみなす",
        o = choose(R, lv, ans, ["利息とは関係ない", "名前が利息でなければ自由", "半分だけ利息とみなす"]);
      return { q: `${WHO[w]}は${FROM[f]}から${man(x)}を借り、利息とは別に「${FEE[n]}」${man(fee)}を払う約束をした。この${FEE[n]}は？`, opts: o, ans, v: `${x}.${n}.${fee}.${f}.${w}:${o.join(".")}`, a: {} }; });
  K("iyakukin", 0, "songai", "songai", "違約金も賠償の約束", "違約金にも上限があります。", "返すのが遅れたときの違約金は、賠償額の予定とみなされ、上限があります。",
    "債務の不履行による賠償額の予定には上限があり、違約金は賠償額の予定とみなします（利息制限法 第4条）。", ["r4"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, AMT), ans = "賠償の約束とみなし、上限がある",
        o = choose(R, lv, ans, ["上限はない", "違約金の約束はすべて無効", "利息とみなす"]);
      return { q: `${WHO[w]}は${FROM[f]}から${man(x)}を借り、返すのが遅れたら違約金を払う約束をした。この違約金は？`, opts: o, ans, v: `${x}.${f}.${w}:${o.join(".")}`, a: {} }; });
  K("ichinen", 0, "keisan", "keisan", "1年の利息の上限", "元本×上限の利率です。", "1年の利息の上限は、元本×上限の利率（20%・18%・15%）です。",
    "元本10万円未満は年2割、100万円未満は年1割8分、100万円以上は年1割5分の利率で計算した金額が上限です（利息制限法 第1条）。", ["r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, AMT), c = capOf(x), ans = man(x * c / 100),
        o = choose(R, lv, ans, [man(x * c / 1000), man(x * (c + 5) / 100), man(x * c * 2 / 100), man(x / 10)]);
      return { q: `${WHO[w]}は${FROM[f]}から${man(x)}を1年借りる。利息は1年でいくらまで？`, opts: o, ans, v: `${x}.${f}.${w}:${o.join(".")}`, a: { x } }; });

  // ---- ふつう ----
  const EDGE = [99000, 100000, 990000, 999000, 1000000];
  K("kyokai", 1, "ritsu", "ritsu", "10万円・100万円ちょうど", "「以上」は、その額をふくみます。", "10万円ちょうどは18%、100万円ちょうどは15%です。10万円以上・100万円以上は、その額をふくみます。",
    "元本の額が10万円以上100万円未満は年1割8分、100万円以上は年1割5分です（利息制限法 第1条）。", ["r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, EDGE), ans = `年${capOf(x)}%`, o = choose(R, lv, ans, RATES);
      return { q: `${WHO[w]}は${FROM[f]}から、ちょうど${man(x)}を借りる。利息の上限は年何%？`, opts: o, ans, v: `${x}.${f}.${w}:${o.join(".")}`, a: { x } }; });
  const BIG = [200000, 300000, 500000, 800000, 1000000, 2000000, 3000000, 5000000];
  K("chouka", 1, "keisan", "keisan", "払わなくてよい分", "約束の利息−上限の利息です。", "上限を超える利息の約束では、約束の利息から上限の利息を引いた分が無効で、払わなくてよい分です。",
    "上限の利率で計算した金額を超える利息の約束は、その超過部分について無効とします（利息制限法 第1条）。", ["r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, BIG), c = capOf(x), r = c + pick(R, [2, 4, 5, 7, 10]), ans = man(x * (r - c) / 100),
        o = choose(R, lv, ans, [man(x * r / 100), man(x * c / 100), man(x * (r - c) / 1000), man(x * (r - c) * 2 / 100)]);
      return { q: `${WHO[w]}は${FROM[f]}から${man(x)}を1年、年${r}%の約束で借りた。1年分の利息のうち、無効で払わなくてよいのはいくら？`, opts: o, ans, v: `${x}.${r}.${f}.${w}:${o.join(".")}`, a: { x, r } }; });
  const TB = () => [200000, 300000, 400000, 500000, 600000, 800000];
  function tb(R) { const x = pick(R, TB()), k = pick(R, [20, 25, 30]), t = x * k / 100, rc = x - t, ex = t - rc * 18 / 100; return { x, k, t, rc, ex }; }
  K("tenbiki", 1, "tenbiki", "tenbiki", "天引きは受け取った額で計算", "受け取った額を元本として上限を計算します。", "利息を先に引かれたときは、受け取った額を元本として上限を計算し、超えた分は元本を返したとみなします。",
    "天引額が受領額を元本として計算した上限を超えるときは、その超過部分は、元本の支払に充てたものとみなします（利息制限法 第2条）。", ["r2", "r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), { x, t, rc, ex } = tb(R), ans = man(ex),
        o = choose(R, lv, ans, [man(t), man(t - x * 18 / 100), man(rc * 18 / 100), "0円"]);
      return { q: `${WHO[w]}は${FROM[f]}から${man(x)}を1年借りる約束で、利息${man(t)}を先に引かれ、${man(rc)}を受け取った。元本を返したとみなされるのはいくら？`, opts: o, ans, v: `${x}.${t}.${f}.${w}:${o.join(".")}`, a: { x, t } }; });
  const COST = [["礼金", 1], ["調査料", 1], ["手数料", 1], ["契約書にはる印紙の代金", 0], ["返すときの振込手数料", 0]];
  K("reikin", 1, "minashi", "minashi", "契約や返すための費用は別", "契約を結ぶ費用・返す費用は、利息ではありません。", "礼金・調査料は利息とみなしますが、契約を結ぶ費用や返すための費用は利息とみなしません。",
    "元本以外の金銭は利息とみなしますが、契約の締結及び債務の弁済の費用は、この限りでありません（利息制限法 第3条）。", ["r3"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), c = ri(R, 0, COST.length - 1), x = pick(R, AMT), ans = COST[c][1] ? "利息とみなす" : "利息とみなさない",
        o = choose(R, lv, ans, ["利息とみなす", "利息とみなさない", "半分だけ利息とみなす", "借りる人が決める"]);
      return { q: `${WHO[w]}は${FROM[f]}（お金を貸す仕事ではない）から${man(x)}を借りた。${COST[c][0]}は、利息とみなす？`, opts: o, ans, v: `${x}.${c}.${f}.${w}:${o.join(".")}`, a: { c } }; });
  const P146 = { 20: 2920, 18: 2628, 15: 2190 };
  const SRATES = ["年29.2%", "年26.28%", "年21.9%", "年20%", "年14.6%", "年30%"];
  K("chien146", 1, "songai", "songai", "損害金は1.46倍まで", "上限の利率×1.46です。", "返すのが遅れたときの損害金の約束は、上限の利率の1.46倍（29.2%・26.28%・21.9%）までです。",
    "賠償額の予定は、その元本に対する割合が第1条の率の1.46倍を超えるときは、超過部分が無効です（利息制限法 第4条）。", ["r4", "r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, AMT), ans = pct(P146[capOf(x)]), o = choose(R, lv, ans, SRATES);
      return { q: `${WHO[w]}は${FROM[f]}（お金を貸す仕事ではない）から${man(x)}を借りた。遅れたときの損害金の上限は年何%？`, opts: o, ans, v: `${x}.${f}.${w}:${o.join(".")}`, a: { x } }; });
  K("gyo20", 1, "songai", "songai", "業者の損害金は年20%まで", "お金を貸す仕事の人（業者）は別です。", "業者が貸したお金（営業的金銭消費貸借）では、遅れたときの損害金は、元本にかかわらず年20%までです。",
    "営業的金銭消費貸借上の債務の不履行による賠償額の予定は、元本に対する割合が年2割を超えるときは、超過部分が無効です（利息制限法 第7条）。", ["r7"],
    (R, lv) => { const w = ri(R, 0, 3), x = pick(R, AMT), ans = "年20%", o = choose(R, lv, ans, SRATES.concat(["上限はない"]));
      return { q: `${WHO[w]}は、お金を貸す仕事をしている業者から${man(x)}を借りた。遅れたときの損害金の上限は年何%？`, opts: o, ans, v: `${x}.${w}:${o.join(".")}`, a: { x } }; });
  K("tsukisu", 1, "keisan", "keisan", "数か月なら月の分だけ", "年の利率×月数÷12です。", "借りる期間が1年より短いときの上限の利息は、元本×上限の利率×月数÷12です。",
    "上限は、元本の額に応じた年の利率（年2割・年1割8分・年1割5分）で計算した金額です（利息制限法 第1条）。", ["r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, BIG), m = pick(R, [3, 4, 6, 8, 9]), c = capOf(x), ans = man(x * c * m / 1200),
        o = choose(R, lv, ans, [man(x * c / 100), man(x * c * m / 100), man(x * c * m / 2400), man(x * c * (m + 1) / 1200)]);
      return { q: `${WHO[w]}は${FROM[f]}から${man(x)}を${m}か月借りる。この${m}か月分の利息は、いくらまで？`, opts: o, ans, v: `${x}.${m}.${f}.${w}:${o.join(".")}`, a: { x, m } }; });
  const B20 = [30000, 50000, 80000, 90000], B18 = [100000, 300000, 500000, 990000], B15 = [1000000, 1500000, 3000000, 5000000];
  K("dore", 1, "ritsu", "ritsu", "その上限になる額は？", "10万円・100万円で分けて考えます。", "年20%は10万円未満、年18%は10万円以上100万円未満、年15%は100万円以上です。",
    "元本10万円未満は年2割、10万円以上100万円未満は年1割8分、100万円以上は年1割5分です（利息制限法 第1条）。", ["r1"],
    (R, lv) => { const g = ri(R, 0, 2), c = [20, 18, 15][g], sets = [B20, B18, B15], ans = man(pick(R, sets[g])),
        others = sets.filter((_, i) => i !== g).flat().map(man), o = choose(R, lv, ans, others);
      return { q: `利息の上限が年${c}%になるのは、いくら借りたとき？`, opts: o, ans, v: `${c}:${o.join(".")}`, a: { c } }; });
  const GYOFEE = [["カードの再発行の手数料", 0], ["決められた範囲のATMの利用料", 0], ["事務手数料", 1], ["調査料", 1], ["礼金", 1]];
  K("gyohi", 1, "minashi", "minashi", "業者が受け取る費用", "業者のときは、利息でない費用が決まっています。", "業者が貸すときも手数料は利息とみなします。ただ、カードの再発行の手数料や決められた範囲のATMの利用料は別です。",
    "営業的金銭消費貸借では、カードの再発行の手数料など政令で定める費用はみなし利息にせず、費用の例外は公租公課・ATMの利用料などに限ります（利息制限法 第6条）。", ["r6", "r3"],
    (R, lv) => { const w = ri(R, 0, 3), c = ri(R, 0, GYOFEE.length - 1), x = pick(R, AMT), ans = GYOFEE[c][1] ? "利息とみなす" : "利息とみなさない",
        o = choose(R, lv, ans, ["利息とみなす", "利息とみなさない", "半分だけ利息とみなす", "業者が決める"]);
      return { q: `${WHO[w]}は業者から${man(x)}を借りた。業者が受け取る「${GYOFEE[c][0]}」は、利息とみなす？`, opts: o, ans, v: `${x}.${c}.${w}:${o.join(".")}`, a: { c } }; });

  // ---- むずかしい ----
  K("gassan", 2, "ritsu", "ritsu", "重ねて借りたら合わせた額", "残っている元本と新しい元本を足します。", "同じ業者から重ねて借りたときは、残っている元本と新しく借りる元本を合わせた額で上限を決めます。",
    "営業的金銭消費貸借の債務者が同じ債権者から重ねて借りたときは、残元本と新しい元本の合計額を元本の額とみなします（利息制限法 第5条第1号）。", ["r5", "r1"],
    (R, lv) => { const w = ri(R, 0, 3), a = pick(R, [50000, 200000, 400000, 600000, 900000]), b = pick(R, [30000, 50000, 80000, 200000, 500000]), ans = `年${capOf(a + b)}%`, o = choose(R, lv, ans, RATES);
      return { q: `${WHO[w]}は業者への借金が${man(a)}残っている。同じ業者から新しく${man(b)}を借りる。新しい借金の利息の上限は？`, opts: o, ans, v: `${a}.${b}.${w}:${o.join(".")}`, a: { a, b } }; });
  K("douji", 2, "ritsu", "ritsu", "同時に2つ借りたら合わせた額", "同時に借りた元本を合わせます。", "同じ業者から同時に2つ以上借りたときは、それぞれの上限を、元本を合わせた額で決めます。",
    "債務者が同じ債権者から同時に2以上の営業的金銭消費貸借による貸付けを受けたときは、元本の合計額を元本の額とみなします（利息制限法 第5条第2号）。", ["r5", "r1"],
    (R, lv) => { const w = ri(R, 0, 3), a = pick(R, [30000, 50000, 80000, 300000, 600000]), b = pick(R, [40000, 60000, 200000, 500000]), ans = `年${capOf(a + b)}%`, o = choose(R, lv, ans, RATES);
      return { q: `${WHO[w]}は同じ業者から、同時に${man(a)}と${man(b)}を別々に借りた。${man(a)}のほうの利息の上限は？`, opts: o, ans, v: `${a}.${b}.${w}:${o.join(".")}`, a: { a, b } }; });
  K("tenbiki2", 2, "tenbiki", "tenbiki", "天引きのあと残る元本", "借りた額から、返したとみなす分を引きます。", "天引きで上限を超えた分は元本を返したとみなすので、残る元本は、借りた額からその分を引いた額です。",
    "天引額が受領額を元本として計算した上限を超えるときは、その超過部分は、元本の支払に充てたものとみなします（利息制限法 第2条）。", ["r2", "r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), { x, t, rc, ex } = tb(R), ans = man(x - ex),
        o = choose(R, lv, ans, [man(x), man(rc), man(x - t), man(x + ex)]);
      return { q: `${WHO[w]}は${FROM[f]}から${man(x)}を1年借りる約束で、利息${man(t)}を先に引かれ、${man(rc)}を受け取った。残る元本はいくら？`, opts: o, ans, v: `${x}.${t}.${f}.${w}:${o.join(".")}`, a: { x, t } }; });
  K("chiengaku", 2, "songai", "songai", "損害金の超えた分", "上限は、上限の利率×1.46です。", "損害金の約束が上限（上限の利率の1.46倍）を超えるとき、超えた分は無効で払わなくてよい分です。",
    "賠償額の予定は、その元本に対する割合が第1条の率の1.46倍を超えるときは、その超過部分について無効とします（利息制限法 第4条）。", ["r4", "r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, BIG), c = capOf(x), r = Math.ceil(P146[c] / 100) + pick(R, [1, 3, 5, 8]), ans = man(x * (r * 100 - P146[c]) / 10000),
        o = choose(R, lv, ans, [man(x * r / 100), man(x * P146[c] / 10000), man(x * (r - c) / 100), man(x * (r * 100 - P146[c]) / 20000)]);
      return { q: `${WHO[w]}は${FROM[f]}（お金を貸す仕事ではない）から${man(x)}を借り、返すのが1年遅れた。約束の損害金は年${r}%。無効で払わなくてよいのはいくら？`, opts: o, ans, v: `${x}.${r}.${f}.${w}:${o.join(".")}`, a: { x, r } }; });
  K("gyochien", 2, "songai", "songai", "業者の損害金の超えた分", "業者のときは年20%で比べます。", "業者が貸したときの損害金は年20%まで。約束が年20%を超えるとき、超えた分は無効です。",
    "営業的金銭消費貸借上の賠償額の予定は、元本に対する割合が年2割を超えるときは、その超過部分について無効とします（利息制限法 第7条）。", ["r7"],
    (R, lv) => { const w = ri(R, 0, 3), x = pick(R, BIG), r = pick(R, [22, 24, 25, 26, 28, 30]), ans = man(x * (r - 20) / 100),
        o = choose(R, lv, ans, [man(x * r / 100), man(x * 20 / 100), man(x * (r - capOf(x)) / 100), man(x * (r - 20) / 1000)]);
      return { q: `${WHO[w]}は業者から${man(x)}を借り、返すのが1年遅れた。約束の損害金は年${r}%。無効で払わなくてよいのはいくら？`, opts: o, ans, v: `${x}.${r}.${w}:${o.join(".")}`, a: { x, r } }; });
  K("tesukei", 2, "minashi", "minashi", "手数料を足して比べる", "利息と手数料を合わせて、上限と比べます。", "手数料は利息とみなすので、利息と手数料を合わせた額が上限を超えると、超えた分が無効です。",
    "元本以外の金銭は手数料などの名義を問わず利息とみなし（第3条）、上限の利率で計算した金額を超える部分は無効です（第1条）。", ["r3", "r1"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, [200000, 300000, 500000, 800000]), r = pick(R, [14, 15, 16]), k = pick(R, [6, 8, 10]), fee = x * k / 100, ex = x * (r + k - 18) / 100, ans = man(ex),
        o = choose(R, lv, ans, [man(fee), man(x * r / 100 + fee), "0円", man(x * (r - 18 + k) / 1000)]);
      return { q: `${WHO[w]}は${FROM[f]}から${man(x)}を1年借りる。利息は年${r}%で、ほかに手数料${man(fee)}を払う。無効になるのはいくら？`, opts: o, ans, v: `${x}.${r}.${k}.${f}.${w}:${o.join(".")}`, a: { x, r, k } }; });
  K("iyaku2", 2, "songai", "songai", "違約金と損害金を合わせる", "違約金も賠償の約束なので、足して比べます。", "違約金も賠償額の予定とみなすので、損害金と違約金を合わせた割合が上限（1.46倍）を超えると、超えた分が無効です。",
    "違約金は賠償額の予定とみなし、賠償額の予定は第1条の率の1.46倍を超える部分が無効です（利息制限法 第4条）。", ["r4"],
    (R, lv) => { const w = ri(R, 0, 3), f = ri(R, 0, 3), x = pick(R, AMT), c = capOf(x), a = pick(R, [20, 22, 25]), b = pick(R, [10, 12, 15]), ex = (a + b) * 100 - P146[c], ans = `${pct(ex)}分`,
        o = choose(R, lv, ans, [`${pct((a + b - c) * 100)}分`, `${pct(b * 100)}分`, "超えていない", `${pct(Math.abs(a * 100 - P146[c]))}分`]);
      return { q: `${WHO[w]}は${FROM[f]}（貸す仕事ではない）から${man(x)}を借り、遅れたら年${a}%の損害金と年${b}%の違約金を払う約束をした。上限を超えるのは？`, opts: o, ans, v: `${x}.${a}.${b}.${f}.${w}:${o.join(".")}`, a: { x, a, b } }; });

  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);
  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null;
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, gwhy: GRP_WHY[k.grp], media: MEDIA[k.media], type: "act", rev: false, src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }
  const RSK = { KINDS, BY, GROUPS, GRP_WHY, LV, SRC, MEDIA, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = RSK; else root.RSK = RSK;
})(typeof self !== "undefined" ? self : this);
