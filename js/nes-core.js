// js/nes-core.js

// --- Константы и глобальные переменные ---
var SCREEN_WIDTH = 256;
var SCREEN_HEIGHT = 240;
var FRAMEBUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT;

var canvas_ctx, image;

var AUDIO_BUFFERING = 512;
var SAMPLE_COUNT = 4 * 1024;
var SAMPLE_MASK = SAMPLE_COUNT - 1;
var audio_samples_L = new Float32Array(SAMPLE_COUNT);
var audio_samples_R = new Float32Array(SAMPLE_COUNT);
var audio_write_cursor = 0, audio_read_cursor = 0;

var nes; // Экземпляр NES-эмулятора. Будет пересоздаваться при загрузке ROM
var audio_ctx_global; // Глобальная переменная для AudioContext, используется в main.js

// --- Функции для отрисовки и аудио ---
function onAnimationFrame(){
    if (!canvas_ctx || !image) {
        window.requestAnimationFrame(onAnimationFrame);
        return;
    }

    window.requestAnimationFrame(onAnimationFrame);

    if (nes && nes.loaded) {
        nes.frame();
    } else {
        // Если эмулятор не загружен, можно очистить экран или показать сообщение
        // canvas_ctx.fillStyle = "black";
        // canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    canvas_ctx.putImageData(image, 0, 0);
}

function audio_remain(){
    return (audio_write_cursor - audio_read_cursor) & SAMPLE_MASK;
}

function audio_callback(event){
    var dst = event.outputBuffer;
    var len = dst.length;

    if(nes && nes.loaded && audio_remain() < AUDIO_BUFFERING) {
        nes.frame();
    }

    var dst_l = dst.getChannelData(0);
    var dst_r = dst.getChannelData(1);
    for(var i = 0; i < len; i++){
        var src_idx = (audio_read_cursor + i) & SAMPLE_MASK;
        dst_l[i] = audio_samples_L[src_idx];
        dst_r[i] = audio_samples_R[src_idx];
    }

    audio_read_cursor = (audio_read_cursor + len) & SAMPLE_MASK;
}

// --- Инициализация Canvas и аудио ---
function nes_init_canvas_audio(canvas_id){
    var canvas = document.getElementById(canvas_id);
    if (!canvas) {
        console.error("Canvas элемент с ID " + canvas_id + " не найден.");
        return null;
    }
    canvas_ctx = canvas.getContext("2d");
    image = canvas_ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    canvas_ctx.fillStyle = "black";
    canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    for (let i = 0; i < image.data.length; i += 4) {
        image.data[i] = 0;
        image.data[i+1] = 0;
        image.data[i+2] = 0;
        image.data[i+3] = 255;
    }

    audio_ctx_global = new (window.AudioContext || window.webkitAudioContext)();
    var script_processor = audio_ctx_global.createScriptProcessor(AUDIO_BUFFERING, 0, 2);
    script_processor.onaudioprocess = audio_callback;
    script_processor.connect(audio_ctx_global.destination);

    console.log('AudioContext создан. Состояние:', audio_ctx_global.state);
    return audio_ctx_global;
}

// --- Запуск эмулятора с ROM ---
function nes_boot(rom_data){
    nes = new jsnes.NES({
        onFrame: function(framebuffer_24){
            var j = 0;
            for(var i = 0; i < FRAMEBUFFER_SIZE; i++){
                var pixel = framebuffer_24[i];
                image.data[j++] = (pixel >> 16) & 0xFF;
                image.data[j++] = (pixel >> 8) & 0xFF;
                image.data[j++] = pixel & 0xFF;
                image.data[j++] = 255;
            }
        },
        onAudioSample: function(l, r){
            audio_samples_L[audio_write_cursor] = l;
            audio_samples_R[audio_write_cursor] = r;
            audio_write_cursor = (audio_write_cursor + 1) & SAMPLE_MASK;
        },
    });

    nes.loadROM(rom_data);
    nes.loaded = true;
}

// --- Обработка нажатий клавиш ---
function keyboard(callback, event){
    var player = 1;
    switch(event.keyCode){
        case 38: // UP
            callback(player, jsnes.Controller.BUTTON_UP); break;
        case 40: // Down
            callback(player, jsnes.Controller.BUTTON_DOWN); break;
        case 37: // Left
            callback(player, jsnes.Controller.BUTTON_LEFT); break;
        case 39: // Right
            callback(player, jsnes.Controller.BUTTON_RIGHT); break;
        case 65: // 'a' - кнопка A
            callback(player, jsnes.Controller.BUTTON_A); break;
        case 83: // 's' - кнопка B
            callback(player, jsnes.Controller.BUTTON_B); break;
        case 9: // Tab
            callback(player, jsnes.Controller.BUTTON_SELECT); break;
        case 13: // Return
            callback(player, jsnes.Controller.BUTTON_START); break;
        default: break;
    }
}
