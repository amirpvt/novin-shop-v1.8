<section class="page">
  <div class="container" style="max-width:860px">
    <div class="panel">
      <div class="meta-row">
        <h1 class="page-title num"><?= e($order['order_number']) ?></h1>
        <span class="status" data-status="<?= e($order['order_status']) ?>"><?= e(order_status_label($order['order_status'])) ?></span>
      </div>
      <p><?= e(setting('site_name')) ?> · <?= e(fa_date($order['created_at'])) ?></p>
      <p><?= e($order['name']) ?> · <span class="num"><?= e($order['phone']) ?></span></p>
      <p><?= e($order['address']) ?></p>
      <p>پرداخت: <?= e(payment_method_label($order['payment_method'])) ?> · <?= e(payment_status_label($order['payment_status'])) ?></p>
      <?php if ($order['transaction_id']): ?><p>کد پیگیری بانک: <span class="num"><?= e($order['transaction_id']) ?></span></p><?php endif; ?>
      <div class="table-wrap">
        <table>
          <tr><th>کالا</th><th>واحد</th><th>قیمت</th><th>تعداد</th><th>جمع</th></tr>
          <?php foreach ($items as $item): ?>
            <tr>
              <td><?= e($item['product_name']) ?></td>
              <td><?= e($item['unit_label']) ?></td>
              <td class="num"><?= e(money($item['price'])) ?></td>
              <td class="num"><?= (int) $item['quantity'] ?></td>
              <td class="num"><?= e(money($item['price'] * $item['quantity'])) ?></td>
            </tr>
          <?php endforeach; ?>
        </table>
      </div>
      <h2>جمع: <?= e(money($order['total_amount'])) ?></h2>
      <?php if ($order['payment_method'] === 'card' && $order['payment_status'] !== 'PAID'): ?>
        <div class="info-card no-print">
          <strong>کارت به کارت</strong>
          <div><?= e(setting('card_bank')) ?> · <?= e(setting('card_owner')) ?></div>
          <div class="num" style="font-size:22px;font-weight:900"><?= e(setting('card_number')) ?></div>
          <?php if ($order['receipt_path']): ?><p>رسید ارسال شده است.</p><img src="<?= e(media_url($order['receipt_path'])) ?>" alt="رسید" style="max-width:240px;border-radius:12px"><?php endif; ?>
          <form method="post" action="<?= e(url('order/receipt')) ?>" enctype="multipart/form-data" class="stack">
            <?= csrf_field() ?>
            <input type="hidden" name="order_number" value="<?= e($order['order_number']) ?>">
            <input type="hidden" name="t" value="<?= e($_GET['t'] ?? $order['public_token']) ?>">
            <input type="file" name="receipt" accept="image/*" required>
            <button class="btn btn-dark" type="submit">ارسال تصویر رسید</button>
          </form>
        </div>
      <?php endif; ?>
      <div class="btn-row no-print" style="justify-content:flex-start">
        <a class="btn btn-ghost" href="<?= e(url('order/' . $order['order_number'] . '/invoice', ['t' => $_GET['t'] ?? $order['public_token']])) ?>">چاپ فاکتور</a>
        <button class="btn btn-primary" type="button" onclick="window.print()">چاپ</button>
      </div>
    </div>
  </div>
</section>
