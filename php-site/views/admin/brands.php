<div class="admin-top"><h1>برندها</h1></div>
<div class="split">
  <form class="panel stack" method="post" action="<?= e(url('admin/brands')) ?>" enctype="multipart/form-data">
    <?= csrf_field() ?>
    <input type="hidden" name="id" value="<?= (int) ($edit['id'] ?? 0) ?>">
    <div class="field"><label>نام</label><input name="name" required value="<?= e($edit['name'] ?? '') ?>"></div>
    <div class="field"><label>اسلاگ</label><input name="slug" value="<?= e($edit['slug'] ?? '') ?>"></div>
    <div class="field"><label>توضیح</label><textarea name="description" rows="2"><?= e($edit['description'] ?? '') ?></textarea></div>
    <div class="field"><label>وب‌سایت</label><input name="website" value="<?= e($edit['website'] ?? '') ?>"></div>
    <div class="field"><label>ترتیب</label><input name="sort_order" value="<?= e($edit['sort_order'] ?? 0) ?>"></div>
    <div class="field"><label>لوگو</label><input type="file" name="logo" accept="image/*"></div>
    <label><input type="checkbox" name="is_active" value="1" <?= checked(!$edit || (int) $edit['is_active']) ?>> فعال</label>
    <label><input type="checkbox" name="is_featured" value="1" <?= checked($edit && (int) $edit['is_featured']) ?>> صفحه اصلی</label>
    <button class="btn btn-primary" type="submit">ذخیره</button>
  </form>
  <div class="table-wrap panel">
    <table>
      <?php foreach ($brands as $brand): ?>
        <tr>
          <td><?= e($brand['name']) ?></td>
          <td><a href="<?= e(url('admin/brands', ['id' => $brand['id']])) ?>">ویرایش</a></td>
          <td>
            <form method="post" action="<?= e(url('admin/brands')) ?>"><?= csrf_field() ?>
              <input type="hidden" name="id" value="<?= (int) $brand['id'] ?>">
              <input type="hidden" name="do" value="delete">
              <button type="submit">حذف</button>
            </form>
          </td>
        </tr>
      <?php endforeach; ?>
    </table>
  </div>
</div>
