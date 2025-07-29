/* global Telegram */ // Сообщаем линтеру, что Telegram - это глобальная переменная

// js/main.js

// --- Переменные и функции для WebSocket-соединения ---
let ws;
// ВНИМАНИЕ: Замените 'ws://localhost:8080/ws/stats' на реальный адрес вашего WebSocket-сервера!
// Например: 'wss://your-domain.com/ws/stats' для продакшена (используйте wss для HTTPS)
const WS_URL = 'ws://localhost:8080/ws/stats';

// Функция для получения идентификатора пользователя Telegram
function getUserId() {
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
        return Telegram.WebApp.initDataUnsafe.user.id;
    }
    // Fallback на анонимный ID, если ID пользователя Telegram недоступен (например, при тестировании вне Telegram)
    return 'anon_' + Math.random().toString(36).substring(2, 10);
}

// Функция для отправки статистики через WebSocket
function sendStat(eventType, eventData = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            timestamp: new Date().toISOString(),
            userId: getUserId(), // Добавляем ID пользователя
            eventType: eventType,
            data: eventData
        };
        ws.send(JSON.stringify(message));
        console.log('Отправлена статистика:', message);
    } else {
        console.warn('WebSocket не открыт, не могу отправить статистику:', eventType);
    }
}

// Функция для установки WebSocket-соединения
function connectWebSocket() {
    // Если уже подключен или подключается, ничего не делаем
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
    }

    console.log('Попытка установить WebSocket-соединение с:', WS_URL);
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('WebSocket подключен.');
        sendStat('app_opened'); // Отправляем событие об открытии приложения
    };

    ws.onmessage = (event) => {
        console.log('Получено сообщение WebSocket:', event.data);
        // Здесь можно добавить логику обработки сообщений от сервера
    };

    ws.onclose = (event) => {
        console.warn('WebSocket отключен:', event.code, event.reason);
        // Попытка переподключения после задержки, если это не преднамеренное закрытие (код 1000)
        if (event.code !== 1000) {
            console.log('Попытка переподключиться через 3 секунды...');
            setTimeout(connectWebSocket, 3000);
        }
    };

    ws.onerror = (error) => {
        console.error('Ошибка WebSocket:', error);
        // Закрываем соединение, чтобы сработал onclose и вызвал переподключение
        ws.close();
    };
}


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Starting application initialization.");

    // Инициализация Telegram Web App и адаптация макета
    initTelegramWebApp();

    // Устанавливаем WebSocket-соединение при загрузке страницы
    connectWebSocket();

    if (typeof jsnes === 'undefined' || typeof jsnes.Controller === 'undefined') {
        console.error("Ошибка: Библиотека JSNES или jsnes.Controller не загружены. Экранные кнопки не будут работать.");
        const errorMessage = "Не удалось загрузить эмулятор JSNES. Проверьте подключение к интернету или консоль ошибок.";
        alert(errorMessage); // Используем стандартный alert
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
                // Отправляем статистику о загрузке ROM
                sendStat('rom_loaded', { romName: selectedFile.name, romSize: selectedFile.size });
                alert('Игра загружена!'); // Стандартный alert
            } catch (error) {
                console.error('Ошибка загрузки ROM или запуска игры:', error);
                const errorMessage = 'Не удалось запустить игру. Возможно, файл ROM поврежден или не является NES-образом: ' + error.message;
                alert(errorMessage); // Стандартный alert
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
            alert(message); // Стандартный alert
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

    // --- Отправка статистики при закрытии приложения ---
    // Для Telegram Mini App, событие 'closingWebApp' более надежно, чем window.beforeunload
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.onEvent('closingWebApp', () => {
            sendStat('app_closed'); // Отправляем событие о закрытии приложения
            // Даем небольшую задержку для отправки сообщения, прежде чем приложение закроется
            setTimeout(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.close(1000, 'Mini App closing'); // Грамотно закрываем WebSocket
                }
            }, 100); // 100 мс задержки
        });
    } else {
        // Fallback для браузера, если не в Telegram Web App
        window.addEventListener('beforeunload', () => {
            sendStat('app_closed');
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close(1000, 'Browser closing');
            }
        });
    }
});