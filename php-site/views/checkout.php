<section class="page">
  <div class="container">
    <h1 class="page-title">تکمیل خرید</h1>
    <div class="split">
      <form class="panel stack" method="post" action="<?= e(url('checkout')) ?>">
        <?= csrf_field() ?>
        <input type="hidden" name="back" value="/checkout">
        <div class="field"><label>نام و نام خانوادگی</label><input name="name" required value="<?= e($user['name'] ?? old('name')) ?>"></div>
        <div class="field"><label>شماره تماس</label><input name="phone" required inputmode="tel" value="<?= e($user['phone'] ?? old('phone')) ?>" placeholder="0912..."></div>
        <div class="field"><label>آدرس تحویل</label><textarea name="address" rows="3" required><?= e($user['address'] ?? old('address')) ?></textarea></div>
        <div class="field"><label>توضیح سفارش</label><textarea name="message" rows="2"><?= e(old('message')) ?></textarea></div>
        <div class="label">روش پرداخت</div>
        <?php if (!$methods): ?>
          <div class="alert alert-error">روش پرداختی فعال نیست. با فروشگاه تماس بگیرید.</div>
        <?php endif; ?>
        <?php foreach ($methods as $key => $label): ?>
          <label class="checks"><input type="radio" name="payment_method" value="<?= e($key) ?>" <?= $key === array_key_first($methods) ? 'checked' : '' ?>> <?= e($label) ?></label>
        <?php endforeach; ?>
        <?php if (isset($methods['card'])): ?>
          <div class="info-card">
            کارت <?= e(setting('card_bank')) ?> به نام <?= e(setting('card_owner')) ?>
            <div class="num" style="font-size:20px;font-weight:900"><?= e(setting('card_number')) ?></div>
            بعد از ثبت سفارش، تصویر رسید را در صفحه سفارش بارگذاری کنید.
          </div>
        <?php endif; ?>
        <button class="btn btn-primary" type="submit" <?= $methods ? '' : 'disabled' ?>>ثبت سفارش</button>
      </form>
      <aside class="summary-card">
        <h2>سفارش شما</h2>
        <?php foreach ($items as $item): ?>
          <div class="meta-row"><span><?= e($item['name']) ?> × <?= (int) $item['qty'] ?></span><span class="num"><?= e(money($item['price'] * $item['qty'])) ?></span></div>
        <?php endforeach; ?>
        <hr>
        <strong>جمع: <?= e(money(cart_total($items))) ?></strong>
      </aside>
    </div>
  </div>
</section>
