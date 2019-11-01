/*
 * * Operate Buttons
 * bimg: button_img
 * handler: callback_handler
 * name: button_name
 */
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
        // hover check
        if(str=="hover"){
            this.img = gdi.Image(this.bimg.hover);
        }
        else{
            this.img = gdi.Image(this.bimg.normal);
        }
        window.Repaint();
    }

    trace(x,y){
        // if cursor is over it
        return this.x <= x && x <= this.x + this.w &&
             this.y <= y && y <= this.y + this.h;
     }

    callback(){
        // callback
        this.handler();
    }

    paint(gr){
        // draw
        gr.DrawImage(this.img, this.x, this.y, this.w, this.h, 
            0, 0, this.img.Width, this.img.Height);
    }
}

function button_img(normal_path,hover_path){
    this.normal = normal_path;
    this.hover = hover_path;
}
