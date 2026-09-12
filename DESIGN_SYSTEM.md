# MEDBIKESI — дизайн-система

## Brand personality

MEDBIKESI — профессиональный, спокойный, современный и человечный локальный сервис. Premium здесь означает ясность, аккуратность и внимание, а не дорогой декор.

Не должен выглядеть как государственная больница, клиника эстетической медицины, дешёвая реклама, инфобизнес, SaaS-панель или AI-generated landing.

## Visual thesis

- Светлый porcelain canvas.
- Глубокий ink вместо чистого чёрного.
- Restrained medical teal — основной брендовый цвет.
- Тёплая терракота — только для курса и срочного контекста.
- Тонкая маршрутная линия как функциональный motif «приезд на дом».
- Никаких фотографий или пустых фотозаглушек.
- Иконки — только простые монохромные line icons там, где они ускоряют понимание.

## Цветовые tokens

```css
--background: #f4f1eb;
--surface: #fffdf8;
--surface-muted: #e9ede8;
--text-primary: #17201d;
--text-secondary: #55605b;
--text-muted: #747e79;
--border: #d6ddd7;
--border-strong: #b7c2bb;
--brand: #0b6b5d;
--brand-hover: #075448;
--brand-soft: #dcece6;
--accent: #98482f;
--accent-hover: #783621;
--accent-soft: #f2dfd5;
--success: #167057;
--warning: #a65e1f;
--danger: #963c39;
--whatsapp: #176b4b;
```

Обычный текст на светлом фоне и белый текст на brand/accent должны соответствовать WCAG AA. Яркий WhatsApp green не используется как фон всей системы.

## Typography

- Display: `Noto Serif Display`, fallback `Georgia`, serif.
- UI/body: `Noto Sans`, fallback system sans-serif.
- Шрифты self-hosted в трёх WOFF2-сабсетах с русскими и казахскими символами; внешнего запроса к Google Fonts нет.
- H1: `clamp(2.55rem, 6vw, 5.4rem)`, line-height 0.98–1.03, weight 600.
- H2: `clamp(2rem, 4vw, 3.7rem)`, line-height 1.05, weight 600.
- H3: 1.1–1.35rem, line-height 1.25, weight 650–700.
- Body large: `clamp(1.05rem, 1.8vw, 1.25rem)`, line-height 1.6.
- Body: 1rem, line-height 1.65.
- Small/caption: 0.78–0.9rem, line-height 1.45.
- Eyebrow: 0.72–0.78rem, uppercase, letter-spacing 0.12em, weight 700.
- Button: 0.92–1rem, weight 700.
- Price/metric: tabular numerals, display family only for large values.

Заголовки не должны занимать больше 3–4 строк на 320 px.

## Layout

- Max content width: 1240 px.
- Text measure: 58–68ch.
- Gutter: `clamp(18px, 4vw, 36px)`.
- Section spacing: 72 px mobile, 112–144 px desktop.
- Desktop grid: 12 columns; фактические композиции 5/7, 7/5 и 4/8.
- Mobile: одна колонка, затем progressive disclosure.

## Spacing scale

4, 8, 12, 16, 24, 32, 48, 72, 96, 128 px.

## Radius system

- 2 px: линии и progress.
- 8 px: inputs, компактные controls.
- 14 px: buttons и небольшие панели.
- 22 px: один крупный композиционный panel.
- 999 px: только pills, chips и status.

Нельзя превращать каждую секцию в большую rounded card.

## Shadows and borders

- Основной способ разделения — whitespace и 1 px border.
- Shadow small: `0 8px 28px rgba(22, 32, 29, .06)`.
- Shadow large допустим только для drawer/mobile menu.
- Не использовать glow и стеклянные карточки.

## Components

- `Brand`: wordmark MEDBIKESI + дескриптор.
- `Mode switch`: два направления — выезд и обучение.
- `Button`: primary brand, secondary outline, quiet link, contextual WhatsApp.
- `Service composer`: radio-like selection + готовый CTA.
- `Service list`: category tabs + interactive rows + detail drawer.
- `Urgent strip`: calm accent surface + 103 notice.
- `Process timeline`: horizontal desktop / vertical mobile.
- `Trust ledger`: крупный факт + пояснение, без карточек-метрик.
- `Program accordion`: один открытый модуль, semantic buttons/regions.
- `FAQ`: одна строка на вопрос, большая clickable area.
- `Lead form`: минимум полей, понятная ошибка, WhatsApp fallback.
- `Mobile action bar`: WhatsApp + звонок, safe-area aware.

## Motion

- Reveal: opacity + translateY 10–14 px, 450–600 ms.
- Hover: 160–220 ms.
- Drawer/menu: 260–360 ms.
- Service selection: меняет состояние без прыжка layout.
- `prefers-reduced-motion` отключает reveal, smooth scroll и transforms.

## Page-specific art direction

### Home care

Porcelain + teal. Главный motif — путь от запроса до визита. Тон: прямой, успокаивающий, без обещаний результата.

### Course

Porcelain + muted terracotta. Главный motif — нумерованная учебная программа и практический прогресс. Тон: уверенный, прикладной, без инфобизнес-обещаний.
