<?php $p = $product; ?>
<div class="admin-top"><h1><?= $p ? 'ویرایش محصول' : 'محصول جدید' ?></h1><a href="<?= e(url('admin/products')) ?>">بازگشت</a></div>
<form class="panel stack" method="post" action="<?= e(url('admin/product')) ?>" enctype="multipart/form-data">
  <?= csrf_field() ?>
  <input type="hidden" name="id" value="<?= is_array($p) ? (int) ($p['id'] ?? 0) : 0 ?>">
  <div class="form-grid two">
    <div class="field"><label>نام</label><input name="name" required value="<?= e(field_value('name', $p)) ?>"></div>
    <div class="field"><label>اسلاگ</label><input name="slug" value="<?= e(field_value('slug', $p)) ?>" placeholder="خالی بماند تا خودکار ساخته شود"></div>
  </div>
  <div class="form-grid two">
    <div class="field"><label>دسته</label>
      <select name="category_id" required>
        <option value="">انتخاب</option>
        <?php foreach ($categories as $cat): ?>
          <option value="<?= (int) $cat['id'] ?>" <?= selected(field_value('category_id', $p), $cat['id']) ?>><?= e($cat['name']) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div class="field"><label>برند</label>
      <select name="brand_id">
        <option value="0">بدون برند</option>
        <?php foreach ($brands as $brand): ?>
          <option value="<?= (int) $brand['id'] ?>" <?= selected(field_value('brand_id', $p), $brand['id']) ?>><?= e($brand['name']) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
  </div>
  <div class="field"><label>توضیحات</label><textarea name="description" rows="4"><?= e(field_value('description', $p)) ?></textarea></div>
  <div class="form-grid two">
    <div class="field"><label>قیمت تومان</label><input name="price" required value="<?= e(field_value('price', $p)) ?>"></div>
    <div class="field"><label>قیمت با تخفیف</label><input name="discount_price" value="<?= e(field_value('discount_price', $p)) ?>" placeholder="خالی = بدون تخفیف"></div>
  </div>
  <div class="form-grid two">
    <div class="field"><label>موجودی</label><input name="stock" value="<?= e(field_value('stock', $p, '0')) ?>"></div>
    <div class="field"><label>وزن گرم</label><input name="weight" value="<?= e(field_value('weight', $p, '0')) ?>"></div>
  </div>
  <div class="form-grid two">
    <div class="field"><label>واحد خرده</label>
      <select name="retail_unit"><?php foreach (unit_options() as $k => $label): ?><option value="<?= e($k) ?>" <?= selected(field_value('retail_unit', $p, 'pack'), $k) ?>><?= e($label) ?></option><?php endforeach; ?></select>
    </div>
    <div class="field"><label>واحد عمده</label>
      <select name="wholesale_unit"><?php foreach (unit_options() as $k => $label): ?><option value="<?= e($k) ?>" <?= selected(field_value('wholesale_unit', $p, 'kg'), $k) ?>><?= e($label) ?></option><?php endforeach; ?></select>
    </div>
  </div>
  <div class="form-grid two">
    <div class="field"><label>حداقل عمده</label><input name="wholesale_min_quantity" value="<?= e(field_value('wholesale_min_quantity', $p, '10')) ?>"></div>
    <div class="field"><label>ترتیب</label><input name="sort_order" value="<?= e(field_value('sort_order', $p, '0')) ?>"></div>
  </div>
  <div class="form-grid two">
    <div class="field"><label>برچسب</label>
      <select name="tag">
        <option value="">بدون برچسب</option>
        <?php foreach (['new' => 'جدید', 'best' => 'پرفروش', 'discount' => 'تخفیف', 'special' => 'ویژه'] as $k => $label): ?>
          <option value="<?= e($k) ?>" <?= selected(field_value('tag', $p), $k) ?>><?= e($label) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div class="field"><label>نشان</label>
      <select name="badge">
        <option value="">بدون نشان</option>
        <?php foreach (['fresh' => 'تازه', 'hot' => 'محبوب', 'premium' => 'پریمیوم'] as $k => $label): ?>
          <option value="<?= e($k) ?>" <?= selected(field_value('badge', $p), $k) ?>><?= e($label) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
  </div>
  <div class="field"><label>وضعیت</label>
    <select name="status">
      <option value="published" <?= selected(field_value('status', $p, 'published'), 'published') ?>>منتشر شده</option>
      <option value="draft" <?= selected(field_value('status', $p, 'published'), 'draft') ?>>پیش‌نویس</option>
    </select>
  </div>
  <div class="checks">
    <label><input type="checkbox" name="available" value="1" <?= checked((string) field_value('available', $p, '1', true) === '1') ?>> قابل فروش</label>
    <label><input type="checkbox" name="is_featured" value="1" <?= checked((string) field_value('is_featured', $p, '0', true) === '1') ?>> ویژه صفحه اصلی</label>
  </div>
  <div class="field">
    <label>تصویر</label>
    <?php if (!empty($p['image'])): ?><img src="<?= e(media_url($p['image'])) ?>" alt="" style="width:120px;border-radius:12px"><?php endif; ?>
    <input type="file" name="image" accept="image/*">
    <label class="tiny"><input type="checkbox" name="remove_image" value="1"> حذف تصویر فعلی</label>
  </div>
  <div class="form-grid two">
    <div class="field"><label>کد کالا</label><input name="sku" value="<?= e(field_value('sku', $p)) ?>"></div>
    <div class="field"><label>بارکد</label><input name="barcode" value="<?= e(field_value('barcode', $p)) ?>"></div>
  </div>
  <div>
    <div class="label">گزینه‌های قیمت عمده</div>
    <div id="options">
      <?php
      $opts = (is_array($p) && isset($p['options'])) ? $p['options'] : [];
      $oldLabels = old('opt_label');
      if (is_array($oldLabels)) {
          $opts = [];
          foreach ($oldLabels as $i => $label) {
              $opts[] = ['label' => $label, 'code' => old('opt_code')[$i] ?? '', 'unit_price' => old('opt_price')[$i] ?? ''];
          }
      }
      if (!$opts) {
          $opts = [['label' => '', 'code' => '', 'unit_price' => '']];
      }
      foreach ($opts as $opt): ?>
        <div class="option-row">
          <input name="opt_label[]" placeholder="عنوان، مثلا کارتن" value="<?= e($opt['label']) ?>">
          <input name="opt_code[]" placeholder="کد" value="<?= e($opt['code']) ?>">
          <input name="opt_price[]" inputmode="numeric" placeholder="قیمت" value="<?= e($opt['unit_price']) ?>">
        </div>
      <?php endforeach; ?>
    </div>
    <button class="btn btn-ghost btn-sm" type="button" id="add-option">افزودن گزینه</button>
  </div>
  <button class="btn btn-primary" type="submit">ذخیره محصول</button>
</form>
<?php if ($p): ?>
  <form method="post" action="<?= e(url('admin/product/delete')) ?>" onsubmit="return confirm('حذف یا غیرفعال شود؟')">
    <?= csrf_field() ?>
    <input type="hidden" name="id" value="<?= (int) $p['id'] ?>">
    <button class="btn btn-ghost" type="submit">حذف / غیرفعال</button>
  </form>
<?php endif; ?>
