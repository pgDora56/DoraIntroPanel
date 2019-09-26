// Ver 1.0
//
// 初期値
//

window.DefinePanel("DoraIntroPanel", { author: "Dora F." });


var img_path = fb.ProfilePath+"/panel/img/"; // imgフォルダまでのパスを指定する


class StudyingPlaylist{
    constructor(handles){
        this._songsLen = handles.length;        
    }
}

include(`${fb.ComponentPath}docs\\Flags.js`);
include(`${fb.ComponentPath}docs\\Helpers.js`);

var have_focus = false; // フォーカスの状況を真偽値で持つ
var accept_command = false; // コマンドを受け付けるときにtrue
var command = ""; // コマンドを一時的に入れておく
var displayText = ""; // メッセージテキスト
var displayRemainTime = 0; // テキストを表示しておくコマ数(Repaintごとに1減)
var setTimer;

var autoCopy = true;
var minPercent = 10;
var maxPercent = 90;
var rantroStartPercent = -1;
var ntime = 0;
var playing = "";

var PlayingLocation = -1; // 再生位置を毎度記録


var judgeFormat = window.GetProperty("Judge & Copy Format", "[%animetitle% - ]%title%[ / %artist%][ - %type%][ - $if2(%work_year%,%date%)]");

var rantoro_percent = window.GetProperty("Rantro - StartLocationRange", "10-90");
var outoro_location = 15;
var get_outoro_location = window.GetProperty("Outro - StartLocation", "15");
try{
    outoro_location = parseInt(get_outoro_location);
}catch(e){
    outoro_location = 15;
}
var autoCopy = window.GetProperty("Music Properties Autocopy", false);
var practiceMode = window.GetProperty("Practice Mode - Enabled", false);
var everyoneAnswerMode = window.GetProperty("Everyone Answer Mode - Enabled", false);
var openTime = window.GetProperty("Everyone Answer Mode - Open Time", 15);
var mode = window.GetProperty("Mode - N(ormal) or R(antro) or O(utro)", "N");

var expertKeyOperation = window.GetProperty("Expert Key Operation", false);

var display1 = window.GetProperty("Display Row1 - Year, Genre, Album etc...", "$if(%work_year%,%work_year%$ifequal(%work_year%,%date%,,/%date%),*%date%) $if2(%type%,%genre%) // Album: %album%[ by %album artist%]");
var display2 = window.GetProperty("Display Row2 - AnimeTieup etc...", "$if2(%animetitle%,-)");
var display3 = window.GetProperty("Display Row3 - Song Title etc...", "%title%");
var display4 = window.GetProperty("Display Row4 - Artist Name etc...", "[%artist%][ '//' %ARTIST_MEMBER%]");

var nextSongSearch = window.GetProperty("View Next Song Search Panel", false);

var autoStopTime = window.GetProperty("Auto Stop - 0: unavailable", 0);

var saveFilename = window.GetProperty("Play history save to:", "");
var saveReady = false;

var songDataDraw = !(practiceMode || everyoneAnswerMode);

var skipTime = Infinity;


//==============================================
class button {
    constructor(x,y,w,h,bimg,handler,name){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.bimg = bimg;
        this.handler = handler;
        this.name = name;

        this.img = gdi.Image(bimg.normal);
    }

    cs(str){
        if(str=="hover"){
            this.img = gdi.Image(this.bimg.hover);
        }
        else{
            this.img = gdi.Image(this.bimg.normal);
        }
        window.Repaint();
    }

    trace(x,y){
        return this.x <= x && x <= this.x + this.w &&
             this.y <= y && y <= this.y + this.h;
     }

    callback(){
        this.handler();
    }

    paint(gr){
        gr.DrawImage(this.img, this.x, this.y, this.w, this.h, 
            0, 0, this.img.Width, this.img.Height);
    }
}

var tooltip = window.CreateTooltip();
function button_img(normal_path,hover_path){
    this.normal = normal_path;
    this.hover = hover_path;
}

// var sabi_img = new button_img(img_path+"sabi.png",img_path+"sabi_hover.png");
// var sabi = new button(10, 155, 100, 50, sabi_img, fn_sabi, "サビへ");

var stop_img = new button_img(img_path+"stop.png", img_path+"stop_hover.png");
var stop = new button(0, 25, 50, 50, stop_img, fn_stop, "停止");

var pause_img = new button_img(img_path+"pause.png", img_path+"pause_hover.png");
var pause = new button(50, 25, 50, 50, pause_img, fn_pause, "一時停止");

var play_img = new button_img(img_path+"play.png", img_path+"play_hover.png");
var play = new button(100, 25, 50, 50, play_img, fn_play, "再生");

var previous_img = new button_img(img_path+"previous.png", img_path+"previous_hover.png");
var previous = new button(150, 25, 50, 50, previous_img, fn_previous, "前の曲");

var next_img = new button_img(img_path+"next.png", img_path+"next_hover.png");
var next = new button(200, 25, 50, 50, next_img, fn_next, "次の曲");

var rec_img = new button_img(img_path+"rec.png",img_path+"rec_hover.png");
var rec = new button(300, 25, 50, 50, rec_img, fn_rec, "サビ記録");

var plus_img = new button_img(img_path+"plus.png",img_path+"plus_hover.png");
// var remove = new button(350, 0, 50, 50, remove_img, remove_duplicated_data, "重複削除処理");
var plus = new button(350, 25, 50, 50, plus_img, 
    makePlaylist,
    //open_song_data,
    // copyTest,
    "プレイリスト自動作成");

var musix_img = new button_img(img_path+"musix.png", img_path+"musix_hover.png");
var musix = new button(250, 25, 50, 50, musix_img, fn_sabi, "サビへ");

// var autocopy_on_img = new button_img(img_path+"autocopy_on.png", img_path+"autocopy_on_hover.png");
// var autocopy_off_img = new button_img(img_path+"autocopy_off.png", img_path+"autocopy_off_hover.png");
// var autocopy_on = new button(350, 0, 50, 50, autocopy_on_img, fn_autocopy, "AutoCopyをオフにする");
// var autocopy_off = new button(350, 0, 50, 50, autocopy_off_img, fn_autocopy_off, "AutoCopyをオンにする");

var buttons = [musix, rec, stop, pause, play, previous, next, plus];


//
// Callback関数
//
function fn_stop(){
    fb.Stop();
}

function fn_pause(){
    fb.Pause();
}

function fn_play(){
    fb.Play();
}

function fn_previous(){
    fb.Prev();
}

function fn_next(){
    fb.Next();
}


// function fn_autocopy_on(){
//     autoCopy = false;
//     window.Repaint();
// }

// function fn_autocopy_off(){
//     autoCopy = true;
//     window.Repaint();
// }

function fn_sabi(){
    var time = fb.TitleFormat("%RECORD_TIME%").Eval();
    console.log(time=="?");
    // console.log(time == "?");
    try{
        if(time != "?") {
            fb.PlaybackTime = time;
        }
        else{
            console.log("Don't set Sabi");
            console.log("Sabi:" + time);
        }
    }
    catch{
        console.log("Can't move to Sabi");
        console.log("Sabi:" + time);
    }
}

function on_focus(is_focused){
    have_focus = is_focused;
    window.Repaint();
}

function fn_rec(){
    var handle = fb.CreateHandleList();
    var tfo = fb.TitleFormat("%playback_time_seconds%");
    console.log(tfo.Eval());
    var data = fb.GetNowPlaying();
    handle.Add(data);
    // data.UpdateFileInfoSimple("RECORD_TIME", tfo.Eval());
    handle.UpdateFileInfoFromJSON(
        JSON.stringify({
            'RECORD_TIME' : tfo.Eval()
        })
    );
    window.Repaint();
}


function on_mouse_move(x,y){
    buttons.forEach(function(b){
        if (b.trace(x,y)) {
            b.cs("hover");
        } else {
            b.cs("normal");
        }
    });
    // if(autoCopy){
    //     if(autocopy_on.trace(x,y)) autocopy_on.cs("hover");
    // }
    // else{
    //     if(autocopy_off.trace(x,y)) autocopy_off.paint("normal");
    // }
}

function on_mouse_lbtn_up(x,y){
    buttons.forEach(function(b){
        if (b.trace(x,y)) {
           b.callback();
       }
    });
    have_focus = true;
    // if(autoCopy){
    //     if(autocopy_on.trace(x,y)) autocopy_on.lbtn_up(x,y);
    // }
    // else{
    //     if(autocopy_off.trace(x,y)) autocopy_off.lbtn_up(x,y);
    // }
}

//==============================================

//
// システム系
//

function on_paint(gr){
    every_second_check();

    window.MinHeight = 225;
    
    gr.FillSolidRect(0, 0, window.Width, 25, RGB(135, 206, 255)); // Skyblue back
    gr.FillSolidRect(0, 25, window.Width, 50, RGB(153, 153, 153)); // Gray back
    var backColor = (have_focus) ? RGB(255,255,255) : RGB(225,225,225);
    gr.FillSolidRect(0, 75, window.Width, window.Height - 75, backColor);
    if(fb.GetNowPlaying()){
        var pbtm  = Math.floor(fb.PlaybackTime);
        var pblen = Math.floor(fb.PlaybackLength);
        
        if(songDataDraw){
            var img = utils.GetAlbumArtV2(fb.GetNowPlaying());
            if(img != null){
                var w_per_h = img.Width / img.Height;
                var x = 0;
                var y = 75;
                var h = window.Height - y;
                var w = h * w_per_h;
                var src_x = 0;
                var src_y = 0;
                var src_w = img.Width;
                var src_h = img.Height;
                var angle = 360 * pbtm / pblen;
                var alpha = 40;
                // gr.FillGradRect(510, 10 * w_per_h, w, h, 0, RGB(230, 230, 230), RGB(255, 255, 255));
                gr.DrawImage(img, x, y, w, h, src_x, src_y, src_w, src_h, angle, alpha);
            }
         var timeMin = Math.floor(pbtm / 60);
         var timeSec = pbtm % 60;
         var lengMin = Math.floor(pblen / 60);
         var lengSec = pblen % 60;
         var timeText = timeMin + ":" + ((timeSec < 10) ? ("0" + timeSec) : timeSec) + "/" + lengMin + ":"
                                                             + ((lengSec < 10) ? ("0" + lengSec) : lengSec);
         var timeMS = gr.MeasureString(timeText, fnt(28), 400, 0, 1000, 50);
         var rightDist = timeMS.Width + 10;
         gr.GdiDrawText(timeText, fnt(28), RGB(255, 255, 255), window.Width - rightDist, 30, rightDist, 50); // 時間
        }
    }
    buttons.forEach(function(b){
        b.paint(gr);
    });

    var mode_str = "通常モード";
    if(mode == "R") {
        mode_str = "ラントロモード";
        mode_str += "(" + minPercent + "% ～ " + maxPercent + "%)";
        if(rantroStartPercent != -1) mode_str += " StartAt:" + rantroStartPercent + "%";
    }
    else if(mode == "O") {
        mode_str = "アウトロモード";
        mode_str += "(" + outoro_location + "s前より再生)";
    }
    if(everyoneAnswerMode) { mode_str += " - 全員解答モード" }
    else if(practiceMode) { mode_str += " - 練習モード" }
    var playing_item_location = plman.GetPlayingItemLocation();
    var topText = plman.GetPlaylistName(playing_item_location.PlaylistIndex); // Playlist Name
    var left_margin = 20;
    var v_extra = window.Height - window.MinHeight;
    var v_margin = v_extra / 4;
    gr.GdiDrawText(mode_str, fnt(20, 6), RGB(255, 255, 255), 405, 25, 800, 30); // モード
    if(songDataDraw){
        common_width = window.Width - left_margin;
        if(nextSongSearch){
            // 次曲候補を探すやーつ
            // MovePlaylistSelection
            let playlist_handles = plman.GetPlaylistItems(plman.PlayingPlaylist);
            if(playing_item_location.PlaylistItemIndex + 1 < plman.PlaylistItemCount(plman.PlayingPlaylist)){
                gr.DrawString("Next > " + get_tf(undefined, playlist_handles[playing_item_location.PlaylistItemIndex+1]),
                                        fnt(), RGB(0,0,0), 0, window.Height - 25, common_width, 25, 1);
            }

            if(100 + 25 * 21 < window.Height){
                // 後続20曲を表示
                for(var i = 0; i < 21; i++){
                    try{
                        gr.DrawString("" + ((i==0) ? "Next" : i) + " : " + get_tf(undefined, playlist_handles[playing_item_location.PlaylistItemIndex+i+1]),
                        fnt(), RGB(0,0,0), window.Width / 2 + 10, 75 + 25 * i, common_width, 25, 0);
                    }
                    catch{
                        break;
                    }
                }
            }
            else{
                // 後続11曲を表示
                for(var i = 0; i < 11; i++){
                    try{
                        gr.DrawString("" + ((i==0) ? "Next" : i) + " : " + get_tf(undefined, playlist_handles[playing_item_location.PlaylistItemIndex+i+1]),
                        fnt(), RGB(0,0,0), window.Width / 2 + 10, 75 + 25 * i, common_width, 25, 0);
                    }
                    catch{
                        break;
                    }
                }
            }
            common_width /= 2;
        }
        // console.log("General: " + fb.TitleFormat("%general%"))
        var clr = (fb.TitleFormat("%general%").Eval()=="1") ? RGB(200, 0, 0) : RGB(0, 0, 0);
        gr.DrawString(fb.TitleFormat(display1).Eval(), 
                                    fnt(undefined), clr, left_margin, 80, common_width, 100, 0);
        gr.DrawString(fb.TitleFormat(display2).Eval(), 
                                    fnt(26, 1), clr, left_margin, 105 + v_margin, common_width, 100, 0);
        // gr.DrawString(fb.TitleFormat("$if(%work_year%,%work_year%$ifequal(%work_year%,%date%,,/%date%),*%date%) $if2(%type%,%genre%) // 難易度: %publisher%").Eval(), 
        //                             fnt(undefined), RGB(0, 0, 0), left_margin, 80, common_width, 100);
        // gr.DrawString(fb.TitleFormat("$if2(%album%,-)").Eval(), 
        //                             fnt(26, 1), RGB(0, 0, 0), left_margin, 105 + v_margin, common_width, 100);
        gr.DrawString(fb.TitleFormat(display3).Eval(), 
                                    fnt(30, 1), clr, left_margin, 140 + v_margin * 2, common_width, 100, 0);
        gr.DrawString(fb.TitleFormat(display4).Eval(), 
                                    fnt(20), clr, left_margin, 180 + v_margin * 3, common_width, 100, 0);
        gr.DrawString(fb.TitleFormat("[サビ: %RECORD_TIME%s]").Eval(), fnt(), RGB(255, 255, 255), 405, 50, 100, 30, 0);

        if(fb.IsPlaying) topText += ' [' + (playing_item_location.PlaylistItemIndex + 1) + "/" + plman.PlaylistItemCount(plman.PlayingPlaylist) + ']'; // 何曲目か/プレイリスト総曲数

    }
    else if(everyoneAnswerMode){
        var dis = openTime - pbtm;
        gr.GdiDrawText(String(dis), 
            fnt(50, 1), RGB(0, 0, 0), left_margin, 105 + v_margin, window.Width - left_margin, 100);
    }

    if(displayRemainTime > 0){
        topText += " " + displayText;
        displayRemainTime--;
        if(displayRemainTime <= 0) displayText = ""; 
    }
    if(accept_command){
        // If it can accept command, topText show on command-text.
        topText += " >" + command;
    }
    gr.GdiDrawText(topText, fnt(), RGB(0, 0, 0), 0, 0, window.Width, 25);
}

function on_playback_time(t){
    PlayingLocation = t;
    window.Repaint();
}

function every_second_check(){
    t = PlayingLocation;
    if(everyoneAnswerMode){
        if(t >= openTime && skipTime > t && !songDataDraw){
            open_song_data();
        }
        else if(t >= skipTime && autoStopTime == 0) {
            fb.Next();
        }
    }
    if(t == autoStopTime){
        fb.Pause();
    }
}

function on_playback_seek(){
    window.Repaint();
}

function on_playback_new_track(){
    propertiesReloading();
    var playing_item_location = plman.GetPlayingItemLocation();
    console.log(playing_item_location.PlaylistItemIndex + "/" + plman.PlaylistItemCount(plman.PlayingPlaylist));
    ntime = 0;
    skipTime = Infinity;
    PlayingLocation = -1;
    songDataDraw = !(practiceMode || everyoneAnswerMode);
    window.Repaint();
    var nowPlaying = get_tf();
    console.log(get_tf());
    rantroStartPercent = -1;
    if(mode != "N"){
        if(playing != nowPlaying){
            if(mode == "R"){
                var startPos = (minPercent + Math.random() * (maxPercent - minPercent)) / 100;
                rantroStartPercent = parseInt(startPos * 100);
                console.log("StartAt:" + (fb.PlaybackLength * startPos));
                fb.PlaybackTime = fb.PlaybackLength * startPos;
            }else if(mode == "O"){
                fb.PlaybackTime = fb.PlaybackLength - outoro_location;
            }
            playing = fb.GetNowPlaying();
            console.log(get_tf());
            playing = nowPlaying;
        }
    }
    if(autoCopy){
        setClipboard(nowPlaying);
    }
}

function on_playback_pause(state) {
    if(!state && !everyoneAnswerMode){
        songDataDraw = true;
        window.Repaint();
    }
}

function on_key_down(vkey) {
    console.log("vkey: " + vkey);

    if(vkey == 68 && !expertKeyOperation || vkey == 32) {
        // Push D (UnexpertKeyOperation Mode) or Push Space
        open_song_data_with_repaint();
    }
    else if(vkey == 65 && expertKeyOperation || vkey == 37) {
        // Push Left or Push A (ExpertKeyOperation Mode)
        // Previous
        fb.Prev();
        fb.Pause();
    }
    else if(vkey == 87 && expertKeyOperation || vkey == 38) {
        // Push Up or Push W (ExpertKeyOperation Mode)
       // Sabi
        fn_sabi();
    }
    else if(vkey == 68 && expertKeyOperation || vkey == 39) {
        // Push Right or Push D (ExpertKeyOperation Mode)
        // Next
        fn_next();
        fb.Pause();
        saveReady = true;
        console.log("saveReady turns to true");
    }
    else if(vkey == 83 && expertKeyOperation || vkey == 40) {
        // Push Down or Push S (ExpertKeyOperation Mode)
        // Play & Pause
        if(fb.IsPlaying){
            console.log(plman.PlayingPlaylist);
            if(fb.IsPaused){             
                if(saveReady && saveFilename != ""){
                    appendLineFile("D:\\Quiz\\AIQ\\history\\" + saveFilename, get_tf());
                    saveReady = false;
                }
            }
            fb.Pause();
        }
        else{
            fb.Play();
        }
    }
    else if(vkey == 27) {
        // Push Escape
        commandAcceptChange(false);
    }
    else if(vkey == 186) {
        // Push COLON:
        if(accept_command){
            commandAppend(":");
        }
        else{
            commandAcceptChange(true);
        }
    }
    else if(vkey == 188) {
        // ,
        // Volume Down
        fb.Volume = Math.max(fb.Volume-10, -100);
        console.log("Volume Down => " + fb.Volume);
        displayTextSet("Volume Down => " + fb.Volume, 5);
    }
    else if(vkey == 190) {
        // .
        // Volume x 2
        fb.Volume = Math.min(fb.Volume+10, 0);
        console.log("Volume Up => " + fb.Volume);
        displayTextSet("Volume Up => " + fb.Volume, 5);
    }
    else if(48 <= vkey && vkey <= 57){
        // Push Number key
        var number = vkey - 48;
        if(accept_command){
            commandAppend(number);
        }else{
            // plman.SetPlaylistFocusItem(plman.ActivePlaylist, [plman.GetPlayingItemLocation().PlaylistItemIndex], true);
            var playing_item_location = plman.GetPlayingItemLocation();
            for(var i=0;i<playing_item_location.PlaylistItemIndex;i++){
                plman.SetPlaylistSelectionSingle(plman.ActivePlaylist, i , false);
            }
            plman.SetPlaylistSelectionSingle(plman.ActivePlaylist, playing_item_location.PlaylistItemIndex, true);
            plman.MovePlaylistSelection(plman.ActivePlaylist, (number == 0) ? 10 : number);
            window.Repaint();
        }
    }
    else if(accept_command){
        if(vkey == 8){
            // Push BackSpace
            command = command.slice(0, -1);
            window.Repaint();
        }
        else if(vkey == 13) {
            // Push Enter
            try{
                move_to = command.split(':');
                for(var i = 0; i < move_to.length; i++){
                    if(move_to[i] == "") move_to[i] = "0";
                }
                if(move_to.length > 2 || move_to.length == 0){
                    throw new Error("move_to's length is illigal");
                }
                else if(move_to.length == 1){
                    console.log("move " + move_to[0] + "sec");
                    fb.PlaybackTime = parseInt(move_to[0]);
                }
                else{
                    console.log("move " + move_to[0] + "min" + move_to[1] + "sec");
                    fb.PlaybackTime = parseInt(move_to[0]) * 60 + parseInt(move_to[1]);
                }
            }
            catch{
                displayTextSet("Can't move to " + command, 5);
            }
            commandAcceptChange(false);
        }
    }
}

function commandAppend(st){
    command += st;
    window.Repaint();
}

function commandAcceptChange(mode){
    accept_command = mode;
    command = "";
    window.Repaint();
}

function displayTextSet(text, time){
    displayText = text;
    displayRemainTime = time;
}

//
// 独自関数
//

function propertiesReloading(){
    
    judgeFormat = window.GetProperty("Judge & Copy Format", "[%animetitle% - ]%title%[ / %artist%][ - %type%][ - $if2(%work_year%,%date%)]");

    rantoro_percent = window.GetProperty("Rantro - StartLocationRange", "10-90");
    outoro_location = 15;
    get_outoro_location = window.GetProperty("Outro - StartLocation", "15");
    try{
        outoro_location = parseInt(get_outoro_location);
    }catch(e){
        outoro_location = 15;
    }
    autoCopy = window.GetProperty("Music Properties Autocopy", false);
    practiceMode = window.GetProperty("Practice Mode - Enabled", false);
    everyoneAnswerMode = window.GetProperty("Everyone Answer Mode - Enabled", false);
    openTime = window.GetProperty("Everyone Answer Mode - Open Time", 15);
    mode = window.GetProperty("Mode - N(ormal) or R(antro) or O(utro)", "N");

    display1 = window.GetProperty("Display Row1 - Year, Genre, Album etc...", "$if(%work_year%,%work_year%$ifequal(%work_year%,%date%,,/%date%),*%date%) $if2(%type%,%genre%) // Album: %album%[ by %album artist%]");
    display2 = window.GetProperty("Display Row2 - AnimeTieup etc...", "$if2(%animetitle%,-)");
    display3 = window.GetProperty("Display Row3 - Song Title etc...", "%title%");
    display4 = window.GetProperty("Display Row4 - Artist Name etc...", "[%artist%][ '//' %ARTIST_MEMBER%]");

    songDataDraw =  !(practiceMode || everyoneAnswerMode);

    try{
        var pers = rantoro_percent.split('-');
        minPercent = parseInt(pers[0]);
        maxPercent = parseInt(pers[1]);
    }
    catch(e){
        console.log(e);
        maxPercent = 90;
        minPercent = 10;
    }
    window.Repaint();
}

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
                    hl = getHandleList(n, query, true);
                    plman.InsertPlaylistItems(plid, 0, hl);
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
