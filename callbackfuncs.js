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

