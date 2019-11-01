// Ver 1.0
//
// 初期値
//

window.DefinePanel("DoraIntroPanel", { author: "Dora F." });

// curl TEST
/*
$.ajax({
    type: 'POST',
    url: 'https://discordapp.com/api/webhooks/563387125446344724/Rm-ZNzNdQzHgLQKnV7EzDSJ3A23RdqPU5X3R2THXIaOryQvFR9OVNx2TfKJxyYFrIWEY',
    data:{"username": "Mocho", "avatar_url": "https://pbs.twimg.com/media/D93CoIaUIAAmklR.jpg","content":"Wake up"},
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(function(response){
    console.log(response)
  })
*/
var img_path = fb.ProfilePath+"/panel/img/"; // imgフォルダまでのパスを指定する

include(`${fb.ComponentPath}docs\\Flags.js`);
include(`${fb.ComponentPath}docs\\Helpers.js`);

include(`parts.js`);
include(`myfuncs.js`);
include(`callbackfuncs.js`);

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

var panelHeight = window.GetProperty("Panel Height", "520");
window.MinHeight = panelHeight;

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

// 以上Variables

var tooltip = window.CreateTooltip();

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
}


function on_paint(gr){
    every_second_check();
    const minHeight = 225;
    const pHeight = panelHeight;
    
    console.log(window.Height);

    gr.FillSolidRect(0, 0, window.Width, 25, RGB(135, 206, 255)); // Skyblue back
    gr.FillSolidRect(0, 25, window.Width, 50, RGB(153, 153, 153)); // Gray back
    var backColor = (have_focus) ? RGB(255,255,255) : RGB(225,225,225);
    gr.FillSolidRect(0, 75, window.Width, pHeight - 75, backColor);
    if(fb.GetNowPlaying()){
        var pbtm  = Math.floor(fb.PlaybackTime);
        var pblen = Math.floor(fb.PlaybackLength);
        
        if(songDataDraw){
            var img = utils.GetAlbumArtV2(fb.GetNowPlaying());
            if(img != null){
                var w_per_h = img.Width / img.Height;
                var x = 0;
                var y = 75;
                var h = pHeight - y;
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
    var v_extra = pHeight - minHeight;
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
                                        fnt(), RGB(0,0,0), 0, pHeight - 25, common_width, 25, 1);
            }

            if(100 + 25 * 21 < pHeight){
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

function on_focus(is_focused){
    have_focus = is_focused;
    window.Repaint();
}

function on_playback_seek(){
    window.Repaint();
}

function on_playback_new_track(){
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
