# Playwright Smoke Tests

## Что это

Это быстрые браузерные проверки сайта. Они поднимают локальный сервер, открывают страницу как пользователь и проверяют ключевые сценарии после UI-правок.

Сейчас smoke-набор покрывает:

- клик по hashtag-pill и `Tag copied!`
- возврат из `Tag copied!` обратно к хештегу
- открытие и закрытие story viewer
- открытие и закрытие redirect-overlay в CTA слайдера
- отсутствие старых tooltip-подсказок для stories и home page

## Установка один раз

```powershell
npm install -D @playwright/test
npx playwright install chromium
```

## Запуск

Обычный прогон:

```powershell
npm run test:smoke
```

С открытым браузером:

```powershell
npm run test:smoke:headed
```

UI-режим Playwright:

```powershell
npm run test:smoke:ui
```

## Что смотреть после падения

- HTML-отчёт: `playwright-report/index.html`
- Артефакты падений: `test-results/`
- В отчёте будут screenshot, trace и video только для упавших тестов

## Как этим пользоваться в работе

1. Внесли UI-правки.
2. Выполнили `npm run test:smoke`.
3. Если всё зелёное, базовые пользовательские сценарии не сломаны.
4. Если что-то красное, открываете HTML-отчёт и смотрите, на каком шаге регрессия.

## Как расширять

Добавляйте новые тесты в `tests/smoke.spec.js`.

Хорошие кандидаты для следующих тестов:

- swipe отменяет redirect в мобильной карусели
- welcome-tooltip остаётся text-only
- sticky share menu не конфликтует с promo redirect
- CTA кнопки выравнены одинаково на мобильной ширине
