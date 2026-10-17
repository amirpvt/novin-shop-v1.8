<div class="admin-top">
  <h1>محصولات</h1>
  <a class="btn btn-primary btn-sm" href="<?= e(url('admin/product')) ?>">محصول جدید</a>
</div>
<form method="get" action="<?= e(url('admin/products')) ?>" class="panel" style="margin-bottom:12px">
  <input name="q" value="<?= e($q) ?>" placeholder="جستجوی نام یا کد">
</form>
<div class="table-wrap panel">
  <table>
    <tr><th>کالا</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th></th></tr>
    <?php foreach ($products as $product): ?>
      <tr>
        <td>
          <strong><?= e($product['name']) ?></strong>
          <div class="tiny"><?= e($product['category_name'] ?? '') ?> · <?= e($product['brand_name'] ?? '') ?></div>
        </td>
        <td class="num"><?= e(money(product_effective_price($product))) ?></td>
        <td class="num"><?= (int) $product['stock'] ?></td>
        <td><?= $product['status'] === 'published' ? 'منتشر' : 'پیش‌نویس' ?><?= (int) $product['available'] ? '' : ' / ناموجود' ?></td>
        <td><a class="btn btn-ghost btn-sm" href="<?= e(url('admin/product', ['id' => $product['id']])) ?>">ویرایش</a></td>
      </tr>
    <?php endforeach; ?>
  </table>
</div>
