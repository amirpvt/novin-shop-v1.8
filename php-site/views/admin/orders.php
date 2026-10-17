<div class="admin-top">
  <h1>سفارش‌های خرده</h1>
  <a class="btn btn-ghost btn-sm" href="<?= e(url('admin/orders/export')) ?>">خروجی اکسل</a>
</div>
<form class="panel form-grid two" method="get" action="<?= e(url('admin/orders')) ?>">
  <input name="q" value="<?= e($q) ?>" placeholder="شماره، نام یا تلفن">
  <select name="status" onchange="this.form.submit()">
    <option value="">همه وضعیت‌ها</option>
    <?php foreach (order_status_options() as $key => $label): ?>
      <option value="<?= e($key) ?>" <?= selected($status, $key) ?>><?= e($label) ?></option>
    <?php endforeach; ?>
  </select>
</form>
<div class="table-wrap panel">
  <table>
    <tr><th>شماره</th><th>مشتری</th><th>مبلغ</th><th>پرداخت</th><th>وضعیت</th></tr>
    <?php foreach ($orders as $order): ?>
      <tr>
        <td><a href="<?= e(url('admin/order', ['id' => $order['id']])) ?>"><?= e($order['order_number']) ?></a><div class="tiny"><?= e(fa_date($order['created_at'])) ?></div></td>
        <td><?= e($order['name']) ?><div class="num tiny"><?= e($order['phone']) ?></div></td>
        <td class="num"><?= e(money($order['total_amount'])) ?></td>
        <td><?= e(payment_method_label($order['payment_method'])) ?></td>
        <td><span class="status" data-status="<?= e($order['order_status']) ?>"><?= e(order_status_label($order['order_status'])) ?></span></td>
      </tr>
    <?php endforeach; ?>
  </table>
</div>
