#!/bin/sh
# یک پوشه آماده آپلود می‌سازد و لینک images را به فایل واقعی تبدیل می‌کند.
set -eu
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/../novin-php-upload}"
rm -rf "$OUT"
mkdir -p "$OUT"
cp -a "$ROOT"/. "$OUT"/
rm -rf "$OUT/images" "$OUT/storage/config.php" "$OUT/storage/"*.sqlite "$OUT/storage/sessions/"* "$OUT/storage/logs/"* || true
mkdir -p "$OUT/storage/sessions" "$OUT/storage/logs" "$OUT/uploads/products" "$OUT/uploads/receipts"
if [ -d "$ROOT/../public/images" ]; then
  cp -a "$ROOT/../public/images" "$OUT/images"
elif [ -d "$ROOT/images" ]; then
  cp -aL "$ROOT/images" "$OUT/images"
else
  echo "images folder not found" >&2
  exit 1
fi
echo "Ready: $OUT"
echo "Zip it and upload the contents into public_html."
