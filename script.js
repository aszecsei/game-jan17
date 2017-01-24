/**
 * Created by Alic Szecsei on 1/23/2017.
 */
var game = new function() {
    function update() {

    }

    function draw(ctx) {

    }
};

$(function() {
    var body = $("body");
    body.html("<br /><p><div style='text-align: center;'><h1>Bee Dodger</h1></div></p><br /><p><canvas id='canvas' width='1100' height='600'></canvas></p>");
    body.css("background", "#000");
    body.css('color', '#FFF');
    var qCanvas = $("#canvas");
    var canvas = qCanvas.get(0);
    qCanvas.css("background", "#000");
    qCanvas.css("display", "block");
    qCanvas.css("margin", "0 auto 0 auto");
    qCanvas.css("border", "1px solid white");
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = '#ff0000';
    var FPS = 30;

    function update() {
        game.update();
    }

    function draw() {
        game.draw(ctx);
    }

    setInterval(function() {
        update();
        draw();
    }, 1000/FPS);
});