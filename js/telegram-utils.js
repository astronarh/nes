// js/telegram-utils.js

// Инициализация Telegram Web App
function initTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        console.log("Telegram WebApp SDK инициализирован.");
        // Расширяем приложение на весь экран (по возможности)
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();

        // Устанавливаем цвет фона приложения
        // window.Telegram.WebApp.setBackgroundColor('#222'); // Используем тот же цвет, что в CSS

        // Привязываем кнопку закрытия приложения
        const closeButton = document.getElementById('closeWebAppButton');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                window.Telegram.WebApp.close();
            });
            // Показываем кнопку закрытия, если она скрыта по умолчанию
            window.Telegram.WebApp.MainButton.setText("Закрыть эмулятор").onClick(() => window.Telegram.WebApp.close());
            window.Telegram.WebApp.MainButton.show();
        }
    } else {
        console.warn("Telegram WebApp SDK не найден. Приложение запускается вне Telegram.");
        // Скрываем кнопку "Закрыть приложение", если мы не в Telegram
        const closeButton = document.getElementById('closeWebAppButton');
        if (closeButton) {
            closeButton.style.display = 'none';
        }
    }
}