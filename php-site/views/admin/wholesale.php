<div class="admin-top"><h1>درخواست‌های عمده</h1></div>
<div class="split">
  <div class="table-wrap panel">
    <table>
      <?php foreach ($requests as $req): ?>
        <tr>
          <td><a href="<?= e(url('admin/wholesale', ['id' => $req['id']])) ?>"><?= e($req['request_number']) ?></a></td>
          <td><?= e($req['company_name']) ?><div class="tiny num"><?= e($req['phone']) ?></div></td>
          <td class="num"><?= e(money($req['total_amount'])) ?></td>
          <td><span class="status" data-status="<?= e($req['status']) ?>"><?= e(wholesale_status_label($req['status'])) ?></span></td>
        </tr>
      <?php endforeach; ?>
    </table>
  </div>
  <?php if ($current): ?>
    <form class="panel stack" method="post" action="<?= e(url('admin/wholesale/status')) ?>">
      <?= csrf_field() ?>
      <input type="hidden" name="id" value="<?= (int) $current['id'] ?>">
      <h2><?= e($current['request_number']) ?></h2>
      <p><?= e($current['company_name']) ?> · <?= e($current['contact_person']) ?></p>
      <p class="num"><?= e($current['phone']) ?></p>
      <p><?= e($current['address']) ?></p>
      <p><?= e($current['description']) ?></p>
      <?php foreach ($items as $item): ?>
        <div class="meta-row"><span><?= e($item['product_name']) ?> <?= e($item['option_label']) ?> × <?= (int) $item['quantity'] ?></span><span class="num"><?= e(money($item['unit_price'] * $item['quantity'])) ?></span></div>
      <?php endforeach; ?>
      <strong><?= e(money($current['total_amount'])) ?></strong>
      <select name="status">
        <?php foreach (wholesale_status_options() as $key => $label): ?>
          <option value="<?= e($key) ?>" <?= selected($current['status'], $key) ?>><?= e($label) ?></option>
        <?php endforeach; ?>
      </select>
      <textarea name="admin_note" rows="3"><?= e($current['admin_note']) ?></textarea>
      <button class="btn btn-primary" type="submit">ذخیره وضعیت</button>
    </form>
  <?php endif; ?>
</div>
