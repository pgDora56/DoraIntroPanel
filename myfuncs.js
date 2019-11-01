function get_tf(tf, handle){
    if(tf==undefined) tf = judgeFormat;
    if(handle==undefined){
        if (fb.GetNowPlaying()){
            return fb.TitleFormat(tf).Eval();
        }
    }
    else{
        return fb.TitleFormat(tf).EvalWithMetadb(handle);
    }
}

function getClipboard() { // クリップボードを取得する関数
    var ff = new ActiveXObject("Forms.Form.1");
    var tb = ff.Controls.Add("Forms.TextBox.1").Object;
    tb.MultiLine = true;
    if (tb.CanPaste) tb.Paste();
    ff = null;
    return tb.Text;
  }

function setClipboard(text) { // クリップボードにコピーする関数
  var ff = new ActiveXObject("Forms.Form.1");
  var tb = ff.Controls.Add("Forms.TextBox.1").Object;
  tb.MultiLine = true;
  tb.Text = text;
  tb.SelStart = 0;
  tb.SelLength = tb.TextLength;
  tb.Copy();
  tb = null; ff = null;
}


function fnt(size, style) {
    // 1..Bold 2..Italic(英字のみ？) 4..underline 8..breakline
    // 組み合わせるときは足す
    if(size==undefined) size = 18;
    if(style==undefined) style = 0;
    return gdi.Font("Meiryo UI", size, style);
}

function open_song_data() {
    songDataDraw = true;
    fn_sabi();
    skipTime = parseInt(fb.PlaybackTime + 5);
    if(saveFilename != ""){
        appendLineFile("D:\\Quiz\\AIQ\\history\\" + saveFilename, get_tf());
    }
}

function open_song_data_with_repaint(){
    open_song_data();
    window.Repaint();
}

function appendLineFile(filename, content){
    var old = "";
    try{
        old = utils.ReadTextFile(filename);
        old += "\n"
    }
    catch{
        console.log("Make new file: " + filename);
    }
    finally{
        utils.WriteTextFile(filename, old + content);
        console.log("Write:" + content );
    }
}

function makePlaylist() {
    var enter = getClipboard();
    var lines = enter.split('\n');
    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth()+1;
    var day = d.getDate();
    var hour = d.getHours();
    var min = d.getMinutes();
    var plname = year + "/" + month + "/" + day + " " + hour + ":" + ((min < 10) ? "0" : "") + min
    var plid = plman.PlaylistCount;
    plman.CreatePlaylist(plid, plname);
    var modeCheck = lines[0].split(",");
    if(modeCheck[0] == "balance"){
        // 未実装
        console.log("balance mode is unavailable");
        return;
        console.log("Start making playlist by balance: " + plname);
        var query_lists = [];
        var gravitys = [];
        var totalWeight = 0;
        var base = "";
        var pickSongs = 0;
        lines.forEach(function(line){
            try{
                if(line == "") return; // 空白ならスキップ;
                var datas = line.split(',');
                if(pickSongs == 0){
                    pickSongs = parseInt(datas[1]);
                    console.log("Pick Song: " + pickSongs + "songs");
                    return;
                }
                if(datas[0] == "") {
                    base = datas[1];
                }else{
                    var n = parseInt(datas[0]);
                    query = datas[1];
                    if(base == "" && datas[1] == ""){
                        console.log("Skip");
                        return;
                    }
                    if(base == "") query = datas[1];
                    else if(datas[1] == "") query = base;
                    else query = "(" + base + ") AND (" + datas[1] + ")";
                    var hl = getHandleList(9999999999, query, false);
                    totalWeight += hl.Count * n;
                    gravitys.push(hl.Count * n);
                    query_lists.push(query);
                }
            }catch(e){
                console.log("Error:" + line);
                console.log(e);
            }
        });
        console.log("Total Weight: " + totalWeight);
        for(var i = 0; i < query_lists.length; i++){
            var percent = gravitys[i] / totalWeight;
            var songs = parseInt(pickSongs * percent) + 1;
            console.log("Weight: " + gravitys[i] + " -> " + songs + " songs (" +  percent * 100 + "%)")
            var hl = getHandleList(songs, query_lists[i], true);
            plman.InsertPlaylistItems(plid, 0, hl)
        }
    }
    else{
        console.log("Start making playlist: " + plname);

        var base = "";
        lines.forEach(function(line){
            try{
                if(line == "") return; // 空白ならスキップ
                var datas = line.split(',');
                if(datas[0] == "") {
                    base = datas[1];
                    console.log("MPS > Set Base: " + base);
                }else{
                    var n = parseInt(datas[0]);
                    query = datas[1];
                    if(base == "" && datas[1] == ""){
                        console.log("Skip");
                        return;
                    }
                    
                    if(base == "") query = datas[1];
                    else if(datas[1] == "") query = base;
                    else query = "(" + base + ") AND (" + datas[1] + ")";

                    hl = fb.GetQueryItems(fb.GetLibraryItems(), query);
                    picklist = new FbMetadbHandleList();

                    for(var i = 0; i < n; i++)
                    {
                        if(hl.Count <= 0){
                            n = i;
                            break;
                        } 
                        var r = Math.floor(Math.random() * hl.Count);
                        picklist.Add(hl[r]);
                        hl.RemoveById(r);
                    }
                    // if(hl.Count > n){
                    //     hl.RemoveRange(n, hl.Count); 
                    // }
                    plman.InsertPlaylistItems(plid, 0, picklist);
                    console.log(datas[1] + "->" + n + "Songs");
                    // No error, but playlist made by that is always same.  
                    // It needs be append shuffle function.
                }
            }catch(e){
                console.log("Error:" + line);
                console.log(e);
            }
        });
    }
}

function getHandleList(n, query, write){
    var handle_list = plman.GetPlaylistItems(-1);
    var cand_items = fb.GetQueryItems(fb.GetLibraryItems(), query);
    var cand_count = cand_items.Count;
    if(cand_items.Count <= n) handle_list = cand_items;
    else{
        while(n > 0){
            var idx = Math.floor(Math.random() * cand_items.Count);
            handle_list.Add(cand_items.Item(idx));
            cand_items.RemoveById(idx);
            n -= 1;
        }
    }
    if(write) console.log(handle_list.Count + " songs <- " + query + " // All: " + cand_count + " songs" );
    return handle_list;
}