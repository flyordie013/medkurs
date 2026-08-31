#!/usr/bin/env python3
"""
Собирает из site/ один самодостаточный HTML для превью по ссылке.
Три страницы живут в одном файле; роутер оставляет в DOM только активную,
поэтому id не конфликтуют и весь JS сайта работает без изменений.

    python3 tools/build-preview.py
"""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = ROOT / "build" / "preview.html"

PAGES = [("home", "index.html"), ("kursy", "kursy.html"), ("policy", "policy.html")]


def body_of(html: str) -> str:
    m = re.search(r"<body[^>]*>(.*)</body>", html, re.S | re.I)
    body = m.group(1) if m else html
    # внешние скрипты подключим один раз внизу
    return re.sub(r'<script src="js/[^"]+"></script>\s*', "", body)


def main() -> None:
    css = (SITE / "css" / "style.css").read_text(encoding="utf-8")
    js = "\n".join(
        (SITE / "js" / f).read_text(encoding="utf-8")
        for f in ("config.js", "content.js", "i18n.js", "main.js")
    )

    parts = [
        '<meta charset="utf-8">',
        "<title>Медсестра на дом в Астане</title>",
        '<link rel="preconnect" href="https://fonts.googleapis.com">',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
        'family=Manrope:wght@400;500;600;700;800&display=swap">',
        "<style>\n" + css + "\n.pagewrap{display:contents}\n</style>",
    ]

    for key, fname in PAGES:
        parts.append(
            '<div class="pagewrap" data-page="%s">%s</div>'
            % (key, body_of((SITE / fname).read_text(encoding="utf-8")))
        )

    parts.append(ROUTER)
    parts.append("<script>\n" + js + "\n</script>")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(parts), encoding="utf-8")
    print("→ %s (%.0f КБ)" % (OUT, OUT.stat().st_size / 1024))


ROUTER = """<script>
/* Роутер превью: оставляем в документе только одну страницу,
   чтобы id не дублировались и скрипты сайта работали как на живом сайте. */
(function () {
  var MAP = { 'index.html': 'home', 'kursy.html': 'kursy', 'policy.html': 'policy' };
  var want = (location.hash || '').replace('#/', '');
  if (!/^(home|kursy|policy)$/.test(want)) want = 'home';

  var pages = document.querySelectorAll('.pagewrap');
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].getAttribute('data-page') !== want) pages[i].remove();
  }
  if (want === 'kursy') document.documentElement.setAttribute('data-default-lang', 'kz');

  document.querySelectorAll('a[href]').forEach(function (a) {
    var href = a.getAttribute('href');
    var file = href === '/' ? 'index.html' : href.split('/').pop();
    if (!MAP[file]) return;
    a.setAttribute('href', '#/' + MAP[file]);
    a.addEventListener('click', function (e) {
      e.preventDefault();
      location.hash = '#/' + MAP[file];
      location.reload();
    });
  });
})();
</script>"""

if __name__ == "__main__":
    main()
