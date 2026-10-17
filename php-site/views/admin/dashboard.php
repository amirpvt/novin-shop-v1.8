<div class="admin-top"><h1>داشبورد</h1><a class="btn btn-primary btn-sm" href="<?= e(url('admin/product')) ?>">محصول جدید</a></div>
<div class="stats">
  <div class="stat"><span class="tiny">محصول</span><b class="num"><?= (int) $stats['products'] ?></b></div>
  <div class="stat"><span class="tiny">موجودی کم</span><b class="num"><?= (int) $stats['low_stock'] ?></b></div>
  <div class="stat"><span class="tiny">سفارش امروز</span><b class="num"><?= (int) $stats['orders_today'] ?></b></div>
  <div class="stat"><span class="tiny">فروش امروز</span><b class="num" style="font-size:18px"><?= e(money($stats['sales_today'])) ?></b></div>
</div>
<div class="split" style="margin-top:16px">
  <div class="panel">
    <h2>آخرین سفارش‌ها</h2>
    <p class="tiny">در انتظار: <?= (int) $stats['pending_orders'] ?> · عمده جدید: <?= (int) $stats['new_wholesale'] ?> · پیام نخوانده: <?= (int) $stats['unread'] ?></p>
    <div class="table-wrap">
      <table>
        <?php foreach ($recent_orders as $order): ?>
          <tr>
            <td><a href="<?= e(url('admin/order', ['id' => $order['id']])) ?>"><?= e($order['order_number']) ?></a></td>
            <td><?= e($order['name']) ?></td>
            <td class="num"><?= e(money($order['total_amount'])) ?></td>
            <td><span class="status" data-status="<?= e($order['order_status']) ?>"><?= e(order_status_label($order['order_status'])) ?></span></td>
          </tr>
        <?php endforeach; ?>
      </table>
    </div>
  </div>
  <div class="panel">
    <h2>موجودی کم</h2>
    <?php foreach ($low_products as $product): ?>
      <div class="meta-row"><a href="<?= e(url('admin/product', ['id' => $product['id']])) ?>"><?= e($product['name']) ?></a><span class="num"><?= (int) $product['stock'] ?></span></div>
    <?php endforeach; ?>
    <?php if (!$low_products): ?><p>همه موجودی‌ها بالای ۵ است.</p><?php endif; ?>
  </div>
</div>
