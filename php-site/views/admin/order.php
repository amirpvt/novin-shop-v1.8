<div class="admin-top"><h1 class="num"><?= e($order['order_number']) ?></h1><a href="<?= e(url('admin/orders')) ?>">بازگشت</a></div>
<div class="split">
  <div class="panel">
    <p><?= e($order['name']) ?> · <span class="num"><?= e($order['phone']) ?></span></p>
    <p><?= e($order['address']) ?></p>
    <p><?= e($order['message']) ?></p>
    <?php if ($order['receipt_path']): ?><p>رسید کارت‌به‌کارت:</p><img src="<?= e(media_url($order['receipt_path'])) ?>" alt="رسید" style="max-width:280px;border-radius:12px"><?php endif; ?>
    <table>
      <?php foreach ($items as $item): ?>
        <tr>
          <td><?= e($item['product_name']) ?></td>
          <td class="num"><?= (int) $item['quantity'] ?></td>
          <td class="num"><?= e(money($item['price'] * $item['quantity'])) ?></td>
        </tr>
      <?php endforeach; ?>
    </table>
    <strong><?= e(money($order['total_amount'])) ?></strong>
  </div>
  <form class="panel stack" method="post" action="<?= e(url('admin/order/status')) ?>">
    <?= csrf_field() ?>
    <input type="hidden" name="id" value="<?= (int) $order['id'] ?>">
    <div class="field"><label>وضعیت سفارش</label>
      <select name="order_status">
        <?php foreach (order_status_options() as $key => $label): ?>
          <option value="<?= e($key) ?>" <?= selected($order['order_status'], $key) ?>><?= e($label) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div class="field"><label>وضعیت پرداخت</label>
      <select name="payment_status">
        <?php foreach (['UNPAID' => 'پرداخت نشده', 'PENDING' => 'در انتظار تایید', 'PAID' => 'پرداخت شده', 'FAILED' => 'ناموفق'] as $key => $label): ?>
          <option value="<?= e($key) ?>" <?= selected($order['payment_status'], $key) ?>><?= e($label) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div class="field"><label>یادداشت داخلی</label><textarea name="admin_note" rows="4"><?= e($order['admin_note']) ?></textarea></div>
    <button class="btn btn-primary" type="submit">ذخیره</button>
    <p class="help">لغو سفارش، موجودی را برمی‌گرداند.</p>
  </form>
</div>
