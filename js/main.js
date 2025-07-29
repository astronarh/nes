// js/main.js

// --- УДАЛЕНО: Хак для jsnes.NES.prototype.stop() перемещен в jsnes.min.js напрямую ---
// if (typeof jsnes !== 'undefined' && typeof jsnes.NES !== 'undefined' && typeof jsnes.NES.prototype !== 'undefined') {
//     if (typeof jsnes.NES.prototype.stop !== 'function') {
//         jsnes.NES.prototype.stop = function() {
//             // console.warn("JSNES.NES.prototype.stop() заглушка вызвана.");
//         };
//     }
// }


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Starting application initialization.");

    initTelegramWebApp();

    if (typeof jsnes === 'undefined' || typeof jsnes.Controller === 'undefined') {
        console.error("Ошибка: Библиотека JSNES или jsnes.Controller не загружены. Экранные кнопки не будут работать.");
        alert("Не удалось загрузить эмулятор JSNES. Проверьте подключение к интернету или консоль ошибок.");
        return;
    }

    const audioCtx = nes_init_canvas_audio("nesCanvas");
    if (!audioCtx) {
        console.error("Не удалось инициализировать AudioContext. Звук будет отсутствовать.");
    }

    window.requestAnimationFrame(onAnimationFrame);

    const fileInput = document.getElementById('romFile');
    const resetButton = document.getElementById('resetButton');
    const clearRomButton = document.getElementById('clearRomButton');

    // Обработчик для выбора ROM-файла
    fileInput.addEventListener('change', async (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        if (nes) {
            nes.loaded = false;
        }

        canvas_ctx.fillStyle = "black";
        canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        const reader = new FileReader();
        reader.onload = async function(e) {
            const romDataBinaryString = e.target.result;

            try {
                nes_boot(romDataBinaryString);
                console.log('ROM загружен и игра запущена!');
            } catch (error) {
                console.error('Ошибка загрузки ROM или запуска игры:', error);
                alert('Не удалось запустить игру. Проверьте консоль ошибок в браузере: ' + error.message);
            }
        };
        reader.readAsBinaryString(selectedFile);
    });

    // Обработчик для кнопки "Сбросить эмулятор"
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (nes && nes.loaded) {
                nes.reset();
                console.log('Эмулятор сброшен.');
            } else {
                console.warn('Эмулятор не загружен или не готов для сброса.');
            }
        });
    }

    // Обработчик для кнопки "Перевыбрать ROM"
    if (clearRomButton) {
        clearRomButton.addEventListener('click', () => {
            fileInput.value = '';
            canvas_ctx.fillStyle = "black";
            canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            if (nes) {
                nes.loaded = false;
                console.log('Эмулятор остановлен. ROM очищен. Выберите новый образ.');
            } else {
                console.log('NES эмулятор не был инициализирован. Просто очищаем выбор файла.');
            }
            alert('Выберите новый ROM-файл.');
        });
    }


    // --- Обработка нажатий клавиш (для ПК) ---
    document.addEventListener('keydown', (event) => {
        if (nes && nes.loaded) {
            keyboard(nes.buttonDown, event);
        }
    });
    document.addEventListener('keyup', (event) => {
        if (nes && nes.loaded) {
            keyboard(nes.buttonUp, event);
        }
    });

    // --- Обработка событий для экранных элементов управления (для мобильных) ---
    const touchControls = {
        'dpad-up': jsnes.Controller.BUTTON_UP,
        'dpad-down': jsnes.Controller.BUTTON_DOWN,
        'dpad-left': jsnes.Controller.BUTTON_LEFT,
        'dpad-right': jsnes.Controller.BUTTON_RIGHT,
        'btn-a': jsnes.Controller.BUTTON_A,
        'btn-b': jsnes.Controller.BUTTON_B,
        'btn-select': jsnes.Controller.BUTTON_SELECT,
        'btn-start': jsnes.Controller.BUTTON_START,
    };

    let audioContextResumed = false;

    for (const id in touchControls) {
        const button = document.getElementById(id);
        if (button) {
            console.log(`Прикрепляем pointer слушатели к кнопке: ${id}`);

            button.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (button.releasePointerCapture) {
                    button.releasePointerCapture(e.pointerId);
                }

                if (!audioContextResumed && audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume().then(() => {
                        console.log('AudioContext успешно возобновлен после жеста пользователя.');
                        audioContextResumed = true;
                    }).catch(err => {
                        console.error('Ошибка возобновления AudioContext:', err);
                    });
                } else if (audioCtx && audioCtx.state === 'running') {
                    audioContextResumed = true;
                }

                console.log(`Кнопка нажата (pointerdown): ${id}, NES-кнопка: ${touchControls[id]}`);
                if (nes && nes.loaded) {
                    nes.buttonDown(1, touchControls[id]);
                } else {
                    console.warn(`NES не загружен или не готов при pointerdown ${id}`);
                }
            }, { passive: false });

            button.addEventListener('pointerup', (e) => {
                e.preventDefault();
                console.log(`Кнопка отпущена (pointerup): ${id}, NES-кнопка: ${touchControls[id]}`);
                if (nes && nes.loaded) {
                    nes.buttonUp(1, touchControls[id]);
                } else {
                    console.warn(`NES не загружен или не готов при pointerup ${id}`);
                }
            }, { passive: false });

        } else {
            console.warn(`Элемент с ID '${id}' не найден в DOM.`);
        }
    }
});