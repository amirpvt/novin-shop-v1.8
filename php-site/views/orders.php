<section class="page">
  <div class="container">
    <h1 class="page-title">سفارش‌های من</h1>
    <h2>خرده‌فروشی</h2>
    <div class="table-wrap panel">
      <table>
        <tr><th>شماره</th><th>تاریخ</th><th>مبلغ</th><th>وضعیت</th></tr>
        <?php foreach ($orders as $order): ?>
          <tr>
            <td><a href="<?= e(url('order/' . $order['order_number'])) ?>"><?= e($order['order_number']) ?></a></td>
            <td><?= e(fa_date($order['created_at'])) ?></td>
            <td class="num"><?= e(money($order['total_amount'])) ?></td>
            <td><span class="status" data-status="<?= e($order['order_status']) ?>"><?= e(order_status_label($order['order_status'])) ?></span></td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$orders): ?><tr><td colspan="4">سفارش خرده‌ای ثبت نشده است.</td></tr><?php endif; ?>
      </table>
    </div>
    <h2>درخواست عمده</h2>
    <div class="table-wrap panel">
      <table>
        <tr><th>شماره</th><th>فروشگاه</th><th>مبلغ</th><th>وضعیت</th></tr>
        <?php foreach ($requests as $req): ?>
          <tr>
            <td class="num"><?= e($req['request_number']) ?></td>
            <td><?= e($req['company_name']) ?></td>
            <td class="num"><?= e(money($req['total_amount'])) ?></td>
            <td><span class="status" data-status="<?= e($req['status']) ?>"><?= e(wholesale_status_label($req['status'])) ?></span></td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$requests): ?><tr><td colspan="4">درخواست عمده‌ای نیست.</td></tr><?php endif; ?>
      </table>
    </div>
  </div>
</section>
