# DoraIntroPanel

foobar2000's panel for music intro quiz using Spider Monkey Panel


## Description

* Display your own field
* Starting at random position - Rantoro
* Starting at outro
* Auto questioning function
  * with practice mode
* Auto copy music information
* Support for you to give intro questions
  * The next song can be chosen smoothly

## Usage
1. Install spider monkey panel
2. Download this panel
3. Change `img_path` of `panel.js`
4. Spider monkey panel's configure write `include( [Path to panel.js] );`

## プレイリスト自動生成機能
条件と曲数を指定することで、その条件に合う曲をランダムでピックし、プレイリストを生成します。

記法は
「曲数,条件([Query Syntax](https://foobar2000.xrea.jp/index.php?Query%20syntax)に従う)」
で1行ごとです。曲数を指定しない場合は**BaseQuery**となり、それ以下全てのものにAND条件で適用されます。再度曲数を指定しない行を記述すると上書きされます。

### Example

```
20,genre IS アニメ
,date GREATER 2014
10,artist IS スフィア
10,title HAS 愛
```

この場合はまず1行目で「ジャンルがアニメ」の曲を20曲、2行目はBaseQueryで3,4行目に影響させ、3行目は「歌手がスフィア、かつ(BaseQueryの)年が2014より大きい」曲を10曲、4行目は「曲名に愛が入り、かつ(BaseQueryの)年が2014より大きい」曲を10曲、ランダムでピックしプレイリストを生成します。

## License
[MIT License](LICENSE)