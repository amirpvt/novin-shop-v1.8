<section class="page">
  <div class="container">
    <h1 class="page-title">سفارش عمده</h1>
    <?php if (!$open): ?>
      <div class="alert alert-info">ثبت سفارش عمده فقط برای مشتریان تاییدشده باز است. با <?= e(setting('phone_mobile')) ?> تماس بگیرید.</div>
    <?php endif; ?>
    <div class="split">
      <div class="stack">
        <form class="panel" method="get" action="<?= e(url('wholesale')) ?>">
          <input name="q" value="<?= e($q) ?>" placeholder="جستجوی کالا برای عمده">
        </form>
        <?php foreach ($products as $product): ?>
          <div class="panel line">
            <img src="<?= e(media_url($product['image'])) ?>" alt="">
            <div class="grow">
              <strong><?= e($product['name']) ?></strong>
              <div class="tiny">حداقل <?= (int) $product['wholesale_min_quantity'] ?> <?= e(unit_label($product['wholesale_unit'])) ?></div>
              <?php if (!empty($product['options'])): ?>
                <div class="tiny"><?php foreach ($product['options'] as $opt): ?><?= e($opt['label']) ?>: <?= e(money($opt['unit_price'])) ?> · <?php endforeach; ?></div>
              <?php endif; ?>
            </div>
            <?php if ($open): ?>
              <form method="post" action="<?= e(url('wholesale/add')) ?>">
                <?= csrf_field() ?>
                <input type="hidden" name="product_id" value="<?= (int) $product['id'] ?>">
                <input type="hidden" name="back" value="/wholesale">
                <?php if (!empty($product['options'])): ?>
                  <select name="option_id">
                    <?php foreach ($product['options'] as $opt): ?>
                      <option value="<?= (int) $opt['id'] ?>"><?= e($opt['label']) ?></option>
                    <?php endforeach; ?>
                  </select>
                <?php else: ?>
                  <input type="hidden" name="option_id" value="0">
                <?php endif; ?>
                <input type="number" name="qty" min="<?= (int) $product['wholesale_min_quantity'] ?>" value="<?= (int) $product['wholesale_min_quantity'] ?>" style="width:80px">
                <button class="btn btn-dark btn-sm" type="submit">افزودن</button>
              </form>
            <?php endif; ?>
          </div>
        <?php endforeach; ?>
      </div>
      <aside class="summary-card stack">
        <h2>لیست درخواستی</h2>
        <?php if (!$items): ?>
          <p class="tiny">هنوز کالایی انتخاب نشده.</p>
        <?php else: ?>
          <form method="post" action="<?= e(url('wholesale/update')) ?>" class="stack">
            <?= csrf_field() ?>
            <?php $total = 0; foreach ($items as $item): $total += $item['unit_price'] * $item['qty']; ?>
              <div>
                <strong><?= e($item['name']) ?></strong>
                <div class="tiny"><?= e($item['option_label'] ?: $item['unit_label']) ?> · <?= e(money($item['unit_price'])) ?></div>
                <?php if ($item['below_min']): ?><div class="stock-no">حداقل <?= (int) $item['min_qty'] ?></div><?php endif; ?>
                <input type="number" name="qty[<?= e($item['key']) ?>]" value="<?= (int) $item['qty'] ?>" min="0">
              </div>
            <?php endforeach; ?>
            <button class="btn btn-ghost btn-sm" type="submit">به‌روزرسانی</button>
          </form>
          <strong>جمع تقریبی: <?= e(money($total)) ?></strong>
          <form class="stack" method="post" action="<?= e(url('wholesale/submit')) ?>">
            <?= csrf_field() ?>
            <input name="company_name" required placeholder="نام فروشگاه / شرکت" value="<?= e(old('company_name')) ?>">
            <input name="contact_person" required placeholder="نام رابط" value="<?= e($user['name'] ?? old('contact_person')) ?>">
            <input name="phone" required placeholder="شماره تماس" value="<?= e($user['phone'] ?? old('phone')) ?>">
            <textarea name="address" rows="2" placeholder="آدرس"><?= e($user['address'] ?? old('address')) ?></textarea>
            <textarea name="description" rows="2" placeholder="توضیح تکمیلی"></textarea>
            <button class="btn btn-primary" type="submit" <?= $open ? '' : 'disabled' ?>>ثبت درخواست عمده</button>
          </form>
        <?php endif; ?>
      </aside>
    </div>
  </div>
</section>
