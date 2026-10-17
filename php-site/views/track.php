<section class="page">
  <div class="container" style="max-width:760px">
    <h1 class="page-title">پیگیری سفارش</h1>
    <form class="panel stack" method="post" action="<?= e(url('track')) ?>">
      <?= csrf_field() ?>
      <div class="field"><label>شماره سفارش</label><input name="order_number" required placeholder="ORD- یا WHS-" value="<?= e(old('order_number')) ?>"></div>
      <div class="field"><label>شماره تماسی که با آن ثبت شده</label><input name="phone" required placeholder="09..."></div>
      <button class="btn btn-primary" type="submit">پیگیری</button>
    </form>
    <?php if ($result): ?>
      <div class="panel" style="margin-top:16px">
        <h2 class="num"><?= e($kind === 'wholesale' ? $result['request_number'] : $result['order_number']) ?></h2>
        <div>وضعیت: <span class="status" data-status="<?= e($kind === 'wholesale' ? $result['status'] : $result['order_status']) ?>"><?= e($kind === 'wholesale' ? wholesale_status_label($result['status']) : order_status_label($result['order_status'])) ?></span></div>
        <p>تاریخ: <?= e(fa_date($result['created_at'])) ?></p>
        <p>مبلغ: <?= e(money($result['total_amount'])) ?></p>
        <div class="table-wrap">
          <table>
            <tr><th>کالا</th><th>تعداد</th><th>مبلغ</th></tr>
            <?php foreach ($items as $item): ?>
              <tr>
                <td><?= e($item['product_name']) ?> <?= e($item['option_label'] ?? '') ?></td>
                <td class="num"><?= (int) $item['quantity'] ?></td>
                <td class="num"><?= e(money(($item['price'] ?? $item['unit_price']) * $item['quantity'])) ?></td>
              </tr>
            <?php endforeach; ?>
          </table>
        </div>
      </div>
    <?php endif; ?>
  </div>
</section>
