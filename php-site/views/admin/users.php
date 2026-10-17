<div class="admin-top"><h1>کاربران</h1></div>
<form method="get" class="panel" action="<?= e(url('admin/users')) ?>"><input name="q" value="<?= e($q) ?>" placeholder="نام یا شماره"></form>
<div class="split" style="margin-top:12px">
  <form class="panel stack" method="post" action="<?= e(url('admin/user')) ?>">
    <?= csrf_field() ?>
    <input type="hidden" name="id" value="<?= (int) ($edit['id'] ?? 0) ?>">
    <h2><?= $edit ? 'ویرایش کاربر' : 'کاربر جدید' ?></h2>
    <input name="name" required placeholder="نام" value="<?= e($edit['name'] ?? '') ?>">
    <input name="phone" required placeholder="موبایل" value="<?= e($edit['phone'] ?? '') ?>">
    <input type="password" name="password" placeholder="<?= $edit ? 'رمز جدید، اختیاری' : 'رمز عبور' ?>">
    <select name="role">
      <?php foreach (['manager' => 'مدیر کل', 'admin' => 'ادمین', 'visitor' => 'ویزیتور', 'customer' => 'مشتری'] as $key => $label): ?>
        <option value="<?= e($key) ?>" <?= selected($edit['role'] ?? 'customer', $key) ?>><?= e($label) ?></option>
      <?php endforeach; ?>
    </select>
    <select name="customer_type">
      <?php foreach (['retail' => 'خرده', 'wholesale' => 'عمده', 'both' => 'هر دو'] as $key => $label): ?>
        <option value="<?= e($key) ?>" <?= selected($edit['customer_type'] ?? 'retail', $key) ?>><?= e($label) ?></option>
      <?php endforeach; ?>
    </select>
    <input name="city" placeholder="شهر" value="<?= e($edit['city'] ?? '') ?>">
    <textarea name="address" rows="2" placeholder="آدرس"><?= e($edit['address'] ?? '') ?></textarea>
    <textarea name="notes" rows="2" placeholder="یادداشت داخلی"><?= e($edit['notes'] ?? '') ?></textarea>
    <label><input type="checkbox" name="is_active" value="1" <?= checked(!$edit || (int) $edit['is_active']) ?>> فعال</label>
    <label><input type="checkbox" name="is_wholesale_approved" value="1" <?= checked($edit && (int) $edit['is_wholesale_approved']) ?>> تایید عمده</label>
    <button class="btn btn-primary" type="submit">ذخیره</button>
  </form>
  <div class="table-wrap panel">
    <table>
      <?php foreach ($users as $row): ?>
        <tr>
          <td><?= e($row['name']) ?><div class="tiny num"><?= e($row['phone']) ?></div></td>
          <td><?= e(role_label($row['role'])) ?></td>
          <td><a href="<?= e(url('admin/users', ['id' => $row['id']])) ?>">ویرایش</a></td>
        </tr>
      <?php endforeach; ?>
    </table>
  </div>
</div>
