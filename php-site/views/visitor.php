<div class="admin-top"><h1>پنل ویزیتور</h1><span class="pill">پورسانت تقریبی <?= e(money($commission)) ?></span></div>
<div class="split">
  <div class="stack">
    <form class="panel stack" method="post" action="<?= e(url('visitor/draft')) ?>">
      <?= csrf_field() ?>
      <h2>افزودن کالا</h2>
      <select name="product_id" required>
        <?php foreach ($products as $product): ?>
          <option value="<?= (int) $product['id'] ?>"><?= e($product['name']) ?> — <?= e(money(product_effective_price($product))) ?></option>
        <?php endforeach; ?>
      </select>
      <input type="number" name="qty" value="1" min="1">
      <button class="btn btn-dark" type="submit">افزودن به پیش‌نویس</button>
    </form>
    <div class="panel">
      <h2>پیش‌نویس</h2>
      <?php foreach ($draft as $item): ?>
        <div class="meta-row">
          <span><?= e($item['name']) ?> × <?= (int) $item['qty'] ?></span>
          <form method="post" action="<?= e(url('visitor/draft')) ?>"><?= csrf_field() ?>
            <input type="hidden" name="draft_action" value="remove">
            <input type="hidden" name="product_id" value="<?= (int) $item['product_id'] ?>">
            <button type="submit">حذف</button>
          </form>
        </div>
      <?php endforeach; ?>
      <?php if (!$draft): ?><p class="tiny">خالی است.</p><?php endif; ?>
    </div>
    <form class="panel stack" method="post" action="<?= e(url('visitor/order')) ?>">
      <?= csrf_field() ?>
      <h2>ثبت برای مشتری</h2>
      <select name="customer_id" required>
        <option value="">انتخاب مشتری</option>
        <?php foreach ($customers as $customer): ?>
          <option value="<?= (int) $customer['id'] ?>"><?= e($customer['name']) ?> — <?= e($customer['phone']) ?></option>
        <?php endforeach; ?>
      </select>
      <textarea name="address" rows="2" placeholder="آدرس تحویل"></textarea>
      <textarea name="message" rows="2" placeholder="توضیح"></textarea>
      <label><input type="radio" name="payment_method" value="visitor_cash" checked> نقد</label>
      <label><input type="radio" name="payment_method" value="visitor_credit"> نسیه</label>
      <button class="btn btn-primary" type="submit">ثبت سفارش</button>
    </form>
  </div>
  <div class="stack">
    <form class="panel stack" method="post" action="<?= e(url('visitor/customer')) ?>">
      <?= csrf_field() ?>
      <h2>مشتری جدید</h2>
      <input name="name" required placeholder="نام">
      <input name="phone" required placeholder="موبایل">
      <input name="city" placeholder="شهر">
      <textarea name="address" rows="2" placeholder="آدرس"></textarea>
      <input type="password" name="password" placeholder="رمز، حداقل ۶ کاراکتر">
      <label><input type="checkbox" name="is_wholesale_approved" value="1"> تایید خرید عمده</label>
      <button class="btn btn-ghost" type="submit">ثبت مشتری</button>
    </form>
    <div class="panel">
      <h2>سفارش‌های اخیر</h2>
      <?php foreach ($orders as $order): ?>
        <div class="meta-row"><a href="<?= e(url('order/' . $order['order_number'])) ?>"><?= e($order['order_number']) ?></a><span><?= e(order_status_label($order['order_status'])) ?></span></div>
      <?php endforeach; ?>
    </div>
  </div>
</div>
