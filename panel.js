// Ver 1.0
//
// 初期値
//

window.DefinePanel("DoraIntroPanel", { author: "Dora F.", version: "20.03" });

// var rootDirectory = fb.ProfilePath + "/user-components/foo_spider_monkey_panel/DoraIntroPanel/" // Panel全体のRootFolder
var rootDirectory = fb.ProfilePath + "/user-components/foo_spider_monkey_panel/DoraIntroPanelDev/" // 開発用のRootFolder

consoleWrite("Root Directory: " + rootDirectory);
// imgフォルダまでのパスを指定する
//
var img_path = rootDirectory + "img/"; 

 
// 保存するデータの基準となるパスを指定する
// 既存のフォルダを指定したほうが良い(環境に依る?)
//
var savedata_root_path = rootDirectory + "history/"; 

// Default Value
var display1 = "[%date] [%genre%] // Album: %album%[ by %album artist%]"; // "Display Row1 - Year, Genre, Album etc..."
var display2 = "$if2(%program%,-)"; // "Display Row2 - Tieup etc..."
var display3 = "%title%"; // "Display Row3 - Song Title etc..."
var display4 = "[%artist%][ '//' %ARTIST_MEMBER%]"; // "Display Row4 - Artist Name etc..." 

var judgeFormat = "[%program% - ]%title%[ / %artist%][ - %type%][ - $if2(%work_year%,%date%)]";

var xhr = new ActiveXObject("Microsoft.XMLHTTP"); 
var path = rootDirectory + "setting.json"; // 読み込む外部ファイル

xhr.open("GET", path, true);
xhr.onreadystatechange = function(){
    // ローカルファイル用
    if (xhr.readyState === 4 && xhr.status === 0){
        const settingFile = xhr.responseText; // 外部ファイルの内容
        const jsonData = JSON.parse(settingFile);
        display1 = jsonData.display1;
        display2 = jsonData.display2;
        display3 = jsonData.display3;
        display4 = jsonData.display4;
        judgeFormat = jsonData.format;
    }
};
xhr.send(null);


include(`${fb.ComponentPath}docs\\Flags.js`);
include(`${fb.ComponentPath}docs\\Helpers.js`);

var have_focus = false; // フォーカスの状況を真偽値で持つ
var accept_command = false; // コマンドを受け付けるときにtrue
var command = ""; // コマンドを一時的に入れておく
var displayText = ""; // メッセージテキスト
var setTimer;

var autoCopy = true;
var minPercent = 10;
var maxPercent = 90;
var rantroStartPercent = -1;
var spRantroCD = 0;
var spRantroSeed = 1;
var ntime = 0;
var playing = "";
var everyCheckPass = false;

var isSpotify = false;
var spotRecordTime = "";

var PlayingLocation = -1; // 再生位置を毎度記録

var correctFlag = false;
var correctCount = 0;
var wrongCount = 0;

var mode = window.GetProperty("1. Mode - N(ormal) or R(antro) or O(utro)", "N");
var superRantoroMode = window.GetProperty("1.0. Super Rantoro Mode (Guru Guru Oblate mode)", false);
var rantoro_percent = window.GetProperty("1.1. Rantro - StartLocationRange", "10-90");
var outoro_location = 15;
var get_outoro_location = window.GetProperty("1.2. Outro - StartLocation", "15");
try{
    outoro_location = parseInt(get_outoro_location);
}catch(e){
    outoro_location = 15;
}
var autoCopy = window.GetProperty("3.1. Music Properties Autocopy", false);
var practiceMode = window.GetProperty("2.1. Practice Mode - Enabled", false);
var everyoneAnswerMode = window.GetProperty("2.2. Everyone Answer Mode - Enabled", false);
var openTime = window.GetProperty("2.2.1. Everyone Answer Mode - Open Time", 15);

var expertKeyOperation = window.GetProperty("3.2. Expert Key Operation", false);


var nextSongSearch = window.GetProperty("3.4. View Next Song Search Panel", false);

var autoStopTime = window.GetProperty("2.3. Auto Stop - 0: unavailable", 0);

var saveFilename = window.GetProperty("3.3. Play history save to:", "");
var checkingToolEnabled = window.GetProperty("3.5. Check & Uncheck Counting Tool - Enabled:", false);

var volumeFadeChangingDelta = window.GetProperty("4.1. Volume change per push(< key & > key) - 0 ~ 100", 10);
if(volumeFadeChangingDelta > 100 || volumeFadeChangingDelta < 0) volumeFadeChangingDelta = 10;

var saveReady = false;

var songDataDraw = !(practiceMode || everyoneAnswerMode);

var skipTime = Infinity;

try{
    var pers = rantoro_percent.split('-');
    minPercent = parseInt(pers[0]);
    maxPercent = parseInt(pers[1]);
}
catch(e){
    consoleWrite(e);
    maxPercent = 90;
    minPercent = 10;
}


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
// var sabi = new button(10, 155, 100, 50, sabi_img, fn_gorec, "サビへ");

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
var plus = new button(350, 25, 50, 50, plus_img, 
    //makePlaylist,
    //open_song_data,
    // copyTest,
    addManyLocation,
    "まとめて追加");

var musix_img = new button_img(img_path+"musix.png", img_path+"musix_hover.png");
var musix = new button(250, 25, 50, 50, musix_img, fn_gorec, "サビへ");

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

function fn_gorec(no){
    if(no==undefined) no = 1;
    if(no==0) no = 10;
    no -= 1;
    tarr = rec_to_array();
    try{
        if(tarr != undefined) {
            if(tarr[no] != "-1"){
                fb.PlaybackTime = tarr[no];
                return;
            }
        }
        consoleWrite("Don't set Sabi");
        consoleWrite("Sabi:" + tarr);
    }
    catch{
        consoleWrite("Can't move to Sabi");
        consoleWrite("Sabi:" + tarr);
    }
}

function on_focus(is_focused){
    have_focus = is_focused;
    window.Repaint();
}

function fn_rec(no){
    if(no == undefined) no = 1;
    no -= 1;
    tarr = rec_to_array();
    if(tarr == undefined) tarr = ["-1","-1","-1","-1","-1","-1","-1","-1","-1","-1"];
    var handle = fb.CreateHandleList();
    var tfo = fb.TitleFormat("%playback_time_seconds%");
    consoleWrite(tfo.Eval());
    if(tarr[no] == tfo.Eval()) tarr[no] = "-1";
    else tarr[no] = tfo.Eval();
    saveData = tarr[0];
    for(i=1; i<10; i++) {
        saveData += "," + tarr[i];
    }

    if(isSpotify){
        spotifySettingFileWrite(fb.GetNowPlaying().Path, fb.TitleFormat("%tracknumber%").Eval(), "RECORD_TIME", saveData);
        spotRecordTime = saveData;
    }
    else{
        var data = fb.GetNowPlaying();
        handle.Add(data);
        handle.UpdateFileInfoFromJSON(
            JSON.stringify({
                'RECORD_TIME' : saveData
            })
        );
        window.Repaint();
    }
}

function rec_to_array(){
    var time = (isSpotify) ? spotRecordTime : fb.TitleFormat("%RECORD_TIME%").Eval();
    if(time=="?"){
        return undefined;
    }
    var arr = time.split(",");
    while(arr.length < 10){
        arr.push("-1");
    }
    return arr;
}

function on_mouse_move(x,y){
    buttons.forEach(function(b){
        if (b.trace(x,y)) {
            b.cs("hover");
        } else {
            b.cs("normal");
        }
    });
}

function on_mouse_lbtn_up(x,y){
    buttons.forEach(function(b){
        if (b.trace(x,y)) {
           b.callback();
       }
    });
    have_focus = true;
}

//==============================================

//
// システム系
//

function on_paint(gr){
    every_second_check();

    window.MinHeight = 225;
    
    gr.FillSolidRect(0, 0, window.Width, 25, (isSpotify ? RGB(152,251,152) : RGB(135, 206, 255))); // Skyblue back (Palegreen back when spotify)
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
    if(superRantoroMode || mode == "R") {
        mode_str = ((superRantoroMode) ? "SP" : "") + "ラントロモード";
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
    var cwcount = ""
    if(checkingToolEnabled) cwcount = ((correctFlag) ? "Checked" : "Unchecked") + "/" + correctCount + "-" + wrongCount + " | ";
    var topText = cwcount + plman.GetPlaylistName(playing_item_location.PlaylistIndex); // Playlist Name
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
        var clr = (fb.TitleFormat("%general%").Eval()=="1") ? RGB(200, 0, 0) : RGB(0, 0, 0);
        gr.DrawString(fb.TitleFormat(display1).Eval(), 
                                    fnt(undefined), clr, left_margin, 80, common_width, 100, 0);
        gr.DrawString(fb.TitleFormat(display2).Eval(), 
                                    fnt(26, 1), clr, left_margin, 105 + v_margin, common_width, 100, 0);
        gr.DrawString(fb.TitleFormat(display3).Eval(), 
                                    fnt(30, 1), clr, left_margin, 140 + v_margin * 2, common_width, 100, 0);
        gr.DrawString(fb.TitleFormat(display4).Eval(), 
                                    fnt(20), clr, left_margin, 180 + v_margin * 3, common_width, 100, 0);
        var rectime = (isSpotify) ? spotRecordTime : fb.TitleFormat("[%RECORD_TIME%]").Eval();
        if(rectime != ""){
            var tarr = rectime.split(",");
            var recText = "REC:" + ((tarr[0]=="-1") ? "-" : tarr[0]);
            for(i=1; i<tarr.length; i++)
            {
                recText += ",";
                recText += (tarr[i] == "-1") ? "-" : tarr[i];
            }
            gr.DrawString(recText, fnt(), RGB(255, 255, 255), 405, 50, 500, 30, 0);
        }

        if(fb.IsPlaying) topText += ' [' + (playing_item_location.PlaylistItemIndex + 1) + "/" + plman.PlaylistItemCount(plman.PlayingPlaylist) + ']'; // 何曲目か/プレイリスト総曲数
        if(everyoneAnswerMode && (skipTime - pbtm) <= 3) gr.DrawString((skipTime - pbtm), fnt(60, 1), RGB(255,0,0), window.Width / 2 - 50, window.Height / 2 - 50, 100,100,0);

    }
    else if(everyoneAnswerMode){
        var dis = openTime - pbtm;
        gr.GdiDrawText(String(dis), 
            fnt(50, 1), RGB(0, 0, 0), left_margin, 105 + v_margin, window.Width - left_margin, 100);
    }

    topText += " " + displayText;
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
    if(everyCheckPass){
        everyCheckPass = false;
        return;
    }
    t = PlayingLocation;
    if(superRantoroMode){
        if(t - spRantroCD >= 0.3){
            // Next Position
            var startPos = (minPercent + Math.random() * (maxPercent - minPercent)) / 100;
            rantroStartPercent = parseInt(startPos * 100);
            consoleWrite("MoveAt:" + (fb.PlaybackLength * startPos));
            fb.PlaybackTime = fb.PlaybackLength * startPos;
            spRantroCD = fb.PlaybackTime;
            everyCheckPass = true;
        }
    }
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
    var playing_item_location = plman.GetPlayingItemLocation();
    ntime = 0;
    skipTime = Infinity;
    PlayingLocation = -1;
    songDataDraw = !(practiceMode || everyoneAnswerMode);
    window.Repaint();
    var nowPlaying = get_tf();
    var nowPlayPath = fb.GetNowPlaying().Path;
    isSpotify = nowPlayPath.startsWith("spotify");
    if(isSpotify){
        spotRecordTime = spotifySettingFileLoad(nowPlayPath, fb.TitleFormat("%tracknumber%").Eval(), "RECORD_TIME");
    }
    consoleWrite("New Track:" + get_tf() + " // Track Path:" + nowPlayPath);
    consoleWrite("IsSpotify:" + nowPlayPath.startsWith("spotify"));
    rantroStartPercent = -1;
    if(mode != "N" || superRantoroMode){
        if(playing != nowPlayPath){
            if(mode == "R" || superRantoroMode){
                var startPos = (minPercent + Math.random() * (maxPercent - minPercent)) / 100;
                rantroStartPercent = parseInt(startPos * 100);
                consoleWrite("StartAt:" + (fb.PlaybackLength * startPos));
                fb.PlaybackTime = fb.PlaybackLength * startPos;
                if(superRantoroMode) {
                    spRantroCD = fb.PlaybackTime;
                }
            }else if(mode == "O"){
                fb.PlaybackTime = fb.PlaybackLength - outoro_location;
            }
            consoleWrite(get_tf());
            playing = nowPlayPath;
        }
    }
    if(autoCopy){
        setClipboard(nowPlaying);
    }
    if(correctFlag){
        correctCount += 1;
    }else{
        wrongCount += 1;
    }

    correctFlag = false;
}

function on_playback_pause(state) {
    if(!state && !everyoneAnswerMode){
        songDataDraw = true;
        window.Repaint();
    }
}

function on_key_down(vkey) {
    // consoleWrite("vkey: " + vkey); // For debug

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
        fn_gorec();
    }
    else if(vkey == 68 && expertKeyOperation || vkey == 39) {
        // Push Right or Push D (ExpertKeyOperation Mode)
        // Next
        fn_next();
        fb.Pause();
        saveReady = true;
        consoleWrite("saveReady turns to true");
    }
    else if(vkey == 67){
        // Push C
        correctFlag = !correctFlag;
        window.Repaint();
    }
    else if(vkey == 83 && expertKeyOperation || vkey == 40) {
        // Push Down or Push S (ExpertKeyOperation Mode)
        // Play & Pause
        if(fb.IsPlaying){
            consoleWrite(plman.PlayingPlaylist);
            if(fb.IsPaused){             
                if(saveReady && saveFilename != ""){
                    appendLineFile(savedata_root_path + saveFilename, "[" + getNowTime() + "] " + get_tf());
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
        // Volume Down
        volumeFade(-1 * volumeFadeChangingDelta,20,50);
    }
    else if(vkey == 190) {
        // Volume Up
        volumeFade(volumeFadeChangingDelta,20,50);
    }
    else if(48 <= vkey && vkey <= 57){
        // Push Number key
        var number = vkey - 48;
        if(accept_command){
            commandAppend(number);
        }else if(nextSongSearch){
            var playing_item_location = plman.GetPlayingItemLocation();
            for(var i=0;i<playing_item_location.PlaylistItemIndex;i++){
                plman.SetPlaylistSelectionSingle(plman.ActivePlaylist, i , false);
            }
            plman.SetPlaylistSelectionSingle(plman.ActivePlaylist, playing_item_location.PlaylistItemIndex, true);
            plman.MovePlaylistSelection(plman.ActivePlaylist, (number == 0) ? 10 : number);
            window.Repaint();
        }else{
            fn_gorec(number);
        }
    }
    else if(112 <= vkey && vkey <= 121) {
        var number = vkey - 112;
        fn_rec(number + 1);
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
                    consoleWrite("move " + move_to[0] + "sec");
                    fb.PlaybackTime = parseInt(move_to[0]);
                }
                else{
                    consoleWrite("move " + move_to[0] + "min" + move_to[1] + "sec");
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
    window.Repaint();
    if(time > 0){
        setTimeout(function(){
            if(text==displayText) displayTextSet("", -1);
        }, time * 1000);
    }
}

volumeFadeBusy = false;
function volumeFade(volumeFadeDelta, volumeFadeCount, spendTime, isRecuresive){
    if(isRecuresive == undefined) isRecuresive = false;
    if(spendTime == undefined) spendTime = 100;
    if(volumeFadeBusy && !isRecuresive){
        volumeFadeBusy = false;
        displayTextSet("Volume-fade Stop => " + fb.Volume, 5); 
        return false;
    }
    volumeFadeBusy = true;
    deltaPerClock = volumeFadeDelta / volumeFadeCount;
    fb.Volume = Math.max(Math.min(fb.Volume+deltaPerClock, 0), -100);
    volumeFadeDelta -= deltaPerClock;
    volumeFadeCount -= 1;
    displayTextSet("Volume-fade => " + fb.Volume + "  Remain:" + volumeFadeDelta + "/" + volumeFadeCount, 5); 
    if(volumeFadeCount > 0){
        setTimeout(function() {
             if(volumeFadeBusy) volumeFade(volumeFadeDelta, volumeFadeCount, spendTime, true);
        }, spendTime);
    }
    else{
        volumeFadeBusy = false;
        displayTextSet("Volume Change Complete", 5);
    }
    return true;
}

//
// 独自関数
//
//

function consoleWrite(msg){
    // Panel全体のconsole出力の委任を受ける
    console.log("[DoraIntroPanel] " + msg);
}

function getNowTime(){
    var date = new Date();
    var str = date.getFullYear()
    + '/' + ('0' + (date.getMonth() + 1)).slice(-2)
    + '/' + ('0' + date.getDate()).slice(-2)
    + ' ' + ('0' + date.getHours()).slice(-2)
    + ':' + ('0' + date.getMinutes()).slice(-2)
    + ':' + ('0' + date.getSeconds()).slice(-2);
    return str;
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
    fn_gorec();
    skipTime = parseInt(fb.PlaybackTime + 5);
    if(saveFilename != ""){
        appendLineFile(savedata_root_path + saveFilename, "[" + getNowTime() + "] " + get_tf());
    }
}

function open_song_data_with_repaint(){
    open_song_data();
    window.Repaint();
}

function spotifySettingFileWrite(loc, track, idx, content) {
    var filename = rootDirectory + "spotify\\" + loc.slice(8).replace(":", "-") + "-" + track + ".txt";
    var rewriteLine = idx + "|" + content;
    try{
        old = utils.ReadTextFile(filename);
        params = old.split('\n');
        rewrite = false;
        for(i=0; i<params.length; i++){
            if(params[i].startsWith(idx + "|")){
                consoleWrite(filename + ": " + params[i] + "->" + content);
                params[i] = rewriteLine;
                rewrite = true;
                break;
            }
        }
        if(!rewrite){
            params.push(rewriteLine);
        }
    }
    catch{
        consoleWrite("New spotSetting: " + filename);
        params = [rewriteLine];
    }
    finally{
        utils.WriteTextFile(filename, params.join("\n"));
        consoleWrite("spotSetting write:" + filename );
    }
}

function spotifySettingFileLoad(loc, track, idx){
    try{
        var filename = rootDirectory + "spotify\\" + loc.slice(8).replace(":", "-") + "-" + track + ".txt";
        old = utils.ReadTextFile(filename);
        params = old.split('\n');
        rewrite = false;
        for(i=0; i<params.length; i++){
            if(params[i].startsWith(idx + "|")){
                param = params[i].replace("\n", "").replace("\r","").split("|");
                return param[1];
            }
        }
    }
    catch{
        consoleWrite("Spotify Setting File isn't found");
    }
    return "";
}

function appendLineFile(filename, content){
    var old = "";
    try{
        old = utils.ReadTextFile(filename);
        old += "\n"
    }
    catch{
        consoleWrite("Make new file: " + filename);
    }
    finally{
        utils.WriteTextFile(filename, old + content);
        consoleWrite("Write:" + content );
    }
}

function addManyLocation() {
    var enter = getClipboard();
    var lines = enter.split('\n');
    var datas = lines.map(x => x.replace("\n", "").replace("\r",""));
    consoleWrite(lines);
    consoleWrite(datas);
    plman.AddLocations(plman.ActivePlaylist, datas);
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
        consoleWrite("balance mode is unavailable");
        return;
        consoleWrite("Start making playlist by balance: " + plname);
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
                    consoleWrite("Pick Song: " + pickSongs + "songs");
                    return;
                }
                if(datas[0] == "") {
                    base = datas[1];
                }else{
                    var n = parseInt(datas[0]);
                    query = datas[1];
                    if(base == "" && datas[1] == ""){
                        consoleWrite("Skip");
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
                consoleWrite("Error:" + line);
                consoleWrite(e);
            }
        });
        consoleWrite("Total Weight: " + totalWeight);
        for(var i = 0; i < query_lists.length; i++){
            var percent = gravitys[i] / totalWeight;
            var songs = parseInt(pickSongs * percent) + 1;
            consoleWrite("Weight: " + gravitys[i] + " -> " + songs + " songs (" +  percent * 100 + "%)")
            var hl = getHandleList(songs, query_lists[i], true);
            plman.InsertPlaylistItems(plid, 0, hl)
        }
    }
    else{
        consoleWrite("Start making playlist: " + plname);

        var base = "";
        lines.forEach(function(line){
            try{
                if(line == "") return; // 空白ならスキップ
                var datas = line.split(',');
                if(datas[0] == "") {
                    base = datas[1];
                    consoleWrite("MPS > Set Base: " + base);
                }else{
                    var n = parseInt(datas[0]);
                    query = datas[1];
                    if(base == "" && datas[1] == ""){
                        consoleWrite("Skip");
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
                    consoleWrite(datas[1] + "->" + n + "Songs");
                    // No error, but playlist made by that is always same.  
                    // It needs be append shuffle function.
                }
            }catch(e){
                consoleWrite("Error:" + line);
                consoleWrite(e);
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
    if(write) consoleWrite(handle_list.Count + " songs <- " + query + " // All: " + cand_count + " songs" );
    return handle_list;
}
