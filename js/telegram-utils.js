/* global Telegram */ // Сообщаем линтеру, что Telegram - это глобальная переменная

// js/telegram-utils.js

// Инициализация Telegram Web App
function initTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        console.log("Telegram WebApp SDK инициализирован.");
        Telegram.WebApp.ready(); // Уведомляем Telegram, что приложение готово
        Telegram.WebApp.expand(); // Расширяем приложение на весь экран

        // Обновляем макет при изменении размера вьюпорта (теперь это не так критично для прокручиваемой страницы)
        Telegram.WebApp.onEvent('viewportChanged', () => {
            // В данной конфигурации с прокруткой, `viewportChanged` менее критичен для layout,
            // но полезен для отладки или будущих адаптаций.
            console.log("Viewport changed. Current viewport height:", Telegram.WebApp.viewportHeight);
        });

        // Привязываем кнопку закрытия приложения
        const closeButton = document.getElementById('closeWebAppButton');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                Telegram.WebApp.close();
            });
            // Гарантируем, что главная кнопка Telegram скрыта
            if (Telegram.WebApp.MainButton.isVisible) {
                Telegram.WebApp.MainButton.hide();
            }
        }

        // Больше нет необходимости в `setTimeout` для `updateWebAppLayout`,
        // так как нет сложных расчетов фиксированных позиций.
        // `updateWebAppLayout` теперь сильно упрощена или не нужна.
        // Здесь мы её удалили, поскольку весь макет управляется CSS-потоком.
        console.log("Telegram WebApp layout initialized for scrollable content.");

    } else {
        console.warn("Telegram WebApp SDK не найден. Приложение запускается вне Telegram.");
        const closeButton = document.getElementById('closeWebAppButton');
        if (closeButton) {
            closeButton.style.display = 'none';
        }
    }
}

// Эта функция теперь не нужна, так как макет управляется CSS-потоком
// function updateWebAppLayout() { /* ... */ }