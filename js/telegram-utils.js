// js/telegram-utils.js

// Инициализация Telegram Web App
function initTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        console.log("Telegram WebApp SDK инициализирован.");
        window.Telegram.WebApp.ready(); // Уведомляем Telegram, что приложение готово
        window.Telegram.WebApp.expand(); // Расширяем приложение на весь экран

        // Обновляем макет при изменении размера вьюпорта (например, при появлении/скрытии клавиатуры)
        Telegram.WebApp.onEvent('viewportChanged', updateWebAppLayout);

        // Привязываем кнопку закрытия приложения
        const closeButton = document.getElementById('closeWebAppButton');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                window.Telegram.WebApp.close();
            });
            // Telegram.WebApp.MainButton также можно использовать для закрытия, если она нужна
            // Например:
            // Telegram.WebApp.MainButton.setText("Закрыть эмулятор").onClick(() => window.Telegram.WebApp.close());
            // Telegram.WebApp.MainButton.show();
        }

        // Вызываем обновление макета сразу после инициализации, чтобы установить правильные размеры
        updateWebAppLayout();

    } else {
        console.warn("Telegram WebApp SDK не найден. Приложение запускается вне Telegram.");
        // Скрываем кнопку "Закрыть приложение", если мы не в Telegram
        const closeButton = document.getElementById('closeWebAppButton');
        if (closeButton) {
            closeButton.style.display = 'none';
        }
    }
}

// Функция для динамического обновления макета в Telegram Web App
function updateWebAppLayout() {
    if (!window.Telegram || !Telegram.WebApp) {
        console.warn("Telegram WebApp SDK не готов для обновления макета.");
        return;
    }

    // viewportHeight: текущая высота вьюпорта, динамически меняется при открытии/закрытии клавиатуры.
    // viewportStableHeight: высота вьюпорта без учета клавиатуры.
    const viewportHeight = Telegram.WebApp.viewportHeight;

    const h1Element = document.querySelector('h1');
    const controlsDiv = document.getElementById('controls');
    const nesCanvas = document.getElementById('nesCanvas');
    const touchControlsDiv = document.getElementById('touch-controls');
    const bodyElement = document.body;

    if (!h1Element || !controlsDiv || !nesCanvas || !touchControlsDiv || !bodyElement) {
        console.error("Не найден один из основных элементов DOM для расчета макета.");
        return;
    }

    // Измеряем высоту верхних элементов, включая их отступы
    const h1ComputedStyle = getComputedStyle(h1Element);
    const h1TotalHeight = h1Element.offsetHeight +
        parseFloat(h1ComputedStyle.marginTop || '0') +
        parseFloat(h1ComputedStyle.marginBottom || '0');

    const controlsComputedStyle = getComputedStyle(controlsDiv);
    const controlsTotalHeight = controlsDiv.offsetHeight +
        parseFloat(controlsComputedStyle.marginTop || '0') +
        parseFloat(controlsComputedStyle.marginBottom || '0');

    // Измеряем высоту фиксированных touch-controls. Она уже включает внутренний padding и safe-area-inset-bottom
    const touchControlsActualHeight = touchControlsDiv.offsetHeight;

    // Получаем текущие безопасные отступы сверху и снизу для body
    const bodyPaddingTop = parseFloat(getComputedStyle(bodyElement).paddingTop || '0');
    const bodyPaddingBottom = parseFloat(getComputedStyle(bodyElement).paddingBottom || '0'); // Это safe-area-inset-bottom

    // Вычисляем высоту, доступную для canvas
    // От viewportHeight вычитаем:
    // - Высоту заголовка и его отступов
    // - Высоту блока controls и его отступов
    // - Высоту фиксированного блока touch-controls
    // - Любые padding-top и padding-bottom у body, которые не должны перекрываться canvas
    const availableCanvasHeight = viewportHeight
        - h1TotalHeight
        - controlsTotalHeight
        - touchControlsActualHeight
        - bodyPaddingTop; // Учитываем padding-top body

    // Устанавливаем максимальную высоту для canvas
    // Убедимся, что canvas не станет слишком маленьким (минимум 240px по высоте NES)
    nesCanvas.style.maxHeight = `${Math.max(240, availableCanvasHeight)}px`;

    // Устанавливаем padding-bottom для body, чтобы содержимое НЕ перекрывалось фиксированным блоком touch-controls
    // Это значение должно быть равно реальной высоте touch-controls
    bodyElement.style.paddingBottom = `calc(${touchControlsActualHeight}px + env(safe-area-inset-bottom))`;
}
