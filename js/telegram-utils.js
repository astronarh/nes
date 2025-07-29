// js/telegram-utils.js

// Инициализация Telegram Web App
function initTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        console.log("Telegram WebApp SDK инициализирован.");
        Telegram.WebApp.ready(); // Уведомляем Telegram, что приложение готово
        Telegram.WebApp.expand(); // Расширяем приложение на весь экран

        // Обновляем макет при изменении размера вьюпорта (например, при появлении/скрытии клавиатуры)
        Telegram.WebApp.onEvent('viewportChanged', updateWebAppLayout);

        // Привязываем кнопку закрытия приложения
        const closeButton = document.getElementById('closeWebAppButton');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                Telegram.WebApp.close();
            });
            // НЕ используем Telegram.WebApp.MainButton.show() здесь,
            // чтобы она не конфликтовала с сенсорными кнопками.
            // Если нужна кнопка "Закрыть", используйте обычную HTML-кнопку.
            if (Telegram.WebApp.MainButton.isVisible) {
                Telegram.WebApp.MainButton.hide(); // Гарантируем, что главная кнопка скрыта
            }
        } else {
            // Если HTML-кнопки нет, но MainButton нужна для закрытия
            // Telegram.WebApp.MainButton.setText("Закрыть эмулятор").onClick(() => Telegram.WebApp.close());
            // Telegram.WebApp.MainButton.show();
        }

        // Вызываем обновление макета сразу после инициализации
        // Небольшая задержка, чтобы гарантировать, что все элементы отрисованы
        setTimeout(updateWebAppLayout, 100);

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

    const viewportHeight = Telegram.WebApp.viewportHeight; // Используем текущую высоту вьюпорта

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

    // Измеряем фактическую высоту фиксированных touch-controls.
    // Эта высота уже включает её собственные отступы и safe-area-inset-bottom, если они в CSS
    const touchControlsActualHeight = touchControlsDiv.offsetHeight;

    // Устанавливаем padding-bottom для body, чтобы создать достаточно места для
    // фиксированных touch-controls. Это значение должно быть равно фактической
    // высоте touch-controls.
    // Важно: env(safe-area-inset-bottom) из CSS для body удален и теперь полностью управляется JS.
    bodyElement.style.paddingBottom = `${touchControlsActualHeight}px`;

    // Вычисляем максимальную высоту для canvas.
    // От общей высоты вьюпорта вычитаем:
    // - Высоту верхней безопасной зоны (body padding-top)
    // - Общую высоту заголовка (h1)
    // - Общую высоту блока controls
    // - Общую высоту фиксированного блока touch-controls (которая уже включает нижнюю безопасную зону)
    // - Небольшой дополнительный буфер, чтобы избежать мельчайших перекрытий между элементами
    const bodyPaddingTop = parseFloat(getComputedStyle(bodyElement).paddingTop || '0');
    const buffer = 10; // Небольшой дополнительный буфер для отступов и безопасности

    const availableCanvasHeight = viewportHeight
        - bodyPaddingTop
        - h1TotalHeight
        - controlsTotalHeight
        - touchControlsActualHeight
        - buffer;

    // Устанавливаем максимальную высоту для canvas.
    // Math.max(240, ...) гарантирует, что canvas не станет меньше минимального разрешения NES по высоте.
    nesCanvas.style.maxHeight = `${Math.max(240, availableCanvasHeight)}px`;

    // Опциональные логи для отладки:
    console.log(`Viewport Height: ${viewportHeight}px`);
    console.log(`Body Padding Top: ${bodyPaddingTop}px`);
    console.log(`H1 Total Height: ${h1TotalHeight}px`);
    console.log(`Controls Total Height: ${controlsTotalHeight}px`);
    console.log(`Touch Controls Actual Height: ${touchControlsActualHeight}px`);
    console.log(`Calculated Body Padding Bottom: ${bodyElement.style.paddingBottom}`);
    console.log(`Calculated Canvas Max Height: ${nesCanvas.style.maxHeight}`);
}