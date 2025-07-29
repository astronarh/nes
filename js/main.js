// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Starting application initialization.");

    // Инициализация Telegram Web App и адаптация макета
    initTelegramWebApp();

    if (typeof jsnes === 'undefined' || typeof jsnes.Controller === 'undefined') {
        console.error("Ошибка: Библиотека JSNES или jsnes.Controller не загружены. Экранные кнопки не будут работать.");
        // Заменили alert на более дружественное сообщение для Telegram Mini App
        const errorMessage = "Не удалось загрузить эмулятор JSNES. Проверьте подключение к интернету или консоль ошибок.";
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showAlert(errorMessage);
        } else {
            alert(errorMessage);
        }
        return;
    }

    const audioCtx = nes_init_canvas_audio("nesCanvas");
    if (!audioCtx) {
        console.error("Не удалось инициализировать AudioContext. Звук будет отсутствовать.");
    }

    window.requestAnimationFrame(onAnimationFrame);

    const fileInput = document.getElementById('romFile');
    const clearRomButton = document.getElementById('clearRomButton');

    // Обработчик для выбора ROM-файла
    fileInput.addEventListener('change', async (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        if (nes) {
            nes.loaded = false; // Помечаем как не загруженный перед новой загрузкой
        }

        canvas_ctx.fillStyle = "black";
        canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        const reader = new FileReader();
        reader.onload = async function(e) {
            const romDataBinaryString = e.target.result;

            try {
                nes_boot(romDataBinaryString);
                console.log('ROM загружен и игра запущена!');
                if (window.Telegram && Telegram.WebApp) {
                    Telegram.WebApp.HapticFeedback.notificationOccurred('success'); // Тактильный отклик
                    Telegram.WebApp.showNotification('Игра загружена!');
                }
            } catch (error) {
                console.error('Ошибка загрузки ROM или запуска игры:', error);
                const errorMessage = 'Не удалось запустить игру. Возможно, файл ROM поврежден или не является NES-образом: ' + error.message;
                if (window.Telegram && Telegram.WebApp) {
                    Telegram.WebApp.showAlert(errorMessage);
                    Telegram.WebApp.HapticFeedback.notificationOccurred('error'); // Тактильный отклик
                } else {
                    alert(errorMessage);
                }
            }
        };
        reader.readAsBinaryString(selectedFile);
    });

    // Обработчик для кнопки "Перевыбрать ROM"
    if (clearRomButton) {
        clearRomButton.addEventListener('click', () => {
            fileInput.value = ''; // Очищаем выбранный файл в input
            canvas_ctx.fillStyle = "black";
            canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            if (nes) {
                nes.loaded = false; // Помечаем как не загруженный
                console.log('Эмулятор остановлен. ROM очищен. Выберите новый образ.');
            } else {
                console.log('NES эмулятор не был инициализирован. Просто очищаем выбор файла.');
            }
            const message = 'Выберите новый ROM-файл.';
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.showNotification(message); // Используем уведомление Telegram
                Telegram.WebApp.HapticFeedback.impactOccurred('light'); // Тактильный отклик
            } else {
                alert(message);
            }
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
            button.addEventListener('pointerdown', (e) => {
                e.preventDefault(); // Предотвращаем дефолтные действия (например, прокрутку)
                if (button.releasePointerCapture) {
                    button.releasePointerCapture(e.pointerId); // Освобождаем захват указателя
                }

                // Возобновление AudioContext при первом взаимодействии пользователя
                if (!audioContextResumed && audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume().then(() => {
                        console.log('AudioContext успешно возобновлен после жеста пользователя.');
                        audioContextResumed = true;
                    }).catch(err => {
                        console.error('Ошибка возобновления AudioContext:', err);
                    });
                } else if (audioCtx && audioCtx.state === 'running') {
                    audioContextResumed = true; // Устанавливаем флаг, если уже запущен
                }

                if (nes && nes.loaded) {
                    nes.buttonDown(1, touchControls[id]);
                } else {
                    console.warn(`NES не загружен или не готов при pointerdown ${id}`);
                }
            }, { passive: false }); // passive: false позволяет использовать preventDefault

            button.addEventListener('pointerup', (e) => {
                e.preventDefault(); // Предотвращаем дефолтные действия
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