<section class="page">
  <div class="container">
    <h1 class="page-title">سبد خرید</h1>
    <?php if (!$items): ?>
      <div class="panel empty">
        <div style="font-size:48px">🛒</div>
        <h2>سبد خرید خالی است</h2>
        <a class="btn btn-primary" href="<?= e(url('shop')) ?>">رفتن به فروشگاه</a>
      </div>
    <?php else: ?>
      <div class="layout" style="grid-template-columns:1fr">
        <div class="split">
          <div class="stack">
            <form method="post" action="<?= e(url('cart/update')) ?>" class="stack">
              <?= csrf_field() ?>
              <?php foreach ($items as $item): ?>
                <div class="panel line">
                  <img src="<?= e(media_url($item['image'])) ?>" alt="">
                  <div class="grow">
                    <strong><?= e($item['name']) ?></strong>
                    <div class="tiny"><?= e($item['unit_label']) ?> · <?= e(money($item['price'])) ?></div>
                    <?php if (!$item['in_stock']): ?><div class="stock-no">موجودی کافی نیست</div><?php endif; ?>
                  </div>
                  <input class="qty" type="number" name="qty[<?= (int) $item['product_id'] ?>]" min="0" max="999" value="<?= (int) $item['qty'] ?>">
                  <strong class="num"><?= e(money($item['price'] * $item['qty'])) ?></strong>
                </div>
              <?php endforeach; ?>
              <button class="btn btn-ghost" type="submit">به‌روزرسانی تعداد</button>
            </form>
          </div>
          <aside class="summary-card stack">
            <h2>جمع کل</h2>
            <div class="price"><?= e(money(cart_total($items))) ?></div>
            <a class="btn btn-primary btn-block" href="<?= e(url('checkout')) ?>">ادامه و ثبت سفارش</a>
            <form method="post" action="<?= e(url('cart/clear')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-block" type="submit">خالی کردن سبد</button></form>
          </aside>
        </div>
      </div>
    <?php endif; ?>
  </div>
</section>
