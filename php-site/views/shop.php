<section class="page">
  <div class="container">
    <div class="crumbs"><a href="<?= e(url('')) ?>">خانه</a> / فروشگاه</div>
    <div class="section-head">
      <h1 class="page-title"><?= e($active_category['name'] ?? 'کاتالوگ محصولات نوین') ?></h1>
      <span class="pill"><?= (int) $count ?> کالا</span>
    </div>
    <div class="layout shop">
      <aside class="panel">
        <form method="get" action="<?= e(url('shop')) ?>" class="stack">
          <div class="field">
            <label for="q">جستجو</label>
            <input id="q" name="q" value="<?= e($filters['q']) ?>" placeholder="نام محصول یا برند">
          </div>
          <div>
            <div class="label">دسته‌بندی</div>
            <div class="chip-list">
              <a class="chip <?= $filters['category'] === '' ? 'is-active' : '' ?>" href="<?= e(url('shop', array_filter(['q' => $filters['q'], 'brand' => $filters['brand']]))) ?>">همه</a>
              <?php foreach ($categories as $cat): ?>
                <a class="chip <?= $filters['category'] === $cat['slug'] ? 'is-active' : '' ?>" href="<?= e(url('shop', ['category' => $cat['slug'], 'q' => $filters['q']])) ?>"><?= e($cat['name']) ?></a>
              <?php endforeach; ?>
            </div>
          </div>
          <div class="field">
            <label for="brand">برند</label>
            <select id="brand" name="brand">
              <option value="">همه برندها</option>
              <?php foreach ($brands as $brand): ?>
                <option value="<?= e($brand['slug']) ?>" <?= selected($filters['brand'], $brand['slug']) ?>><?= e($brand['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-grid two">
            <div class="field"><label>حداقل قیمت</label><input name="min" inputmode="numeric" value="<?= e($filters['min']) ?>"></div>
            <div class="field"><label>حداکثر قیمت</label><input name="max" inputmode="numeric" value="<?= e($filters['max']) ?>"></div>
          </div>
          <input type="hidden" name="category" value="<?= e($filters['category']) ?>">
          <label class="checks"><input type="checkbox" name="available" value="1" <?= checked($filters['available']) ?>> فقط موجودها</label>
          <div class="field">
            <label>مرتب‌سازی</label>
            <select name="sort">
              <option value="newest" <?= selected($filters['sort'], 'newest') ?>>جدیدترین</option>
              <option value="price-asc" <?= selected($filters['sort'], 'price-asc') ?>>ارزان‌ترین</option>
              <option value="price-desc" <?= selected($filters['sort'], 'price-desc') ?>>گران‌ترین</option>
              <option value="name" <?= selected($filters['sort'], 'name') ?>>نام</option>
            </select>
          </div>
          <button class="btn btn-dark btn-block" type="submit">اعمال فیلتر</button>
          <a class="btn btn-ghost btn-block" href="<?= e(url('shop')) ?>">پاک کردن</a>
        </form>
      </aside>
      <div>
        <?php if (!$products): ?>
          <div class="panel empty"><h2>کالایی پیدا نشد</h2><p>فیلتر را تغییر دهید یا با فروشگاه تماس بگیرید.</p></div>
        <?php else: ?>
          <div class="product-grid">
            <?php foreach ($products as $product): ?>
              <?php require base_dir() . '/views/partials/product_card.php'; ?>
            <?php endforeach; ?>
          </div>
          <?= paginate_links((int) $filters['page'], (int) $pages, array_filter([
              'q' => $filters['q'],
              'category' => $filters['category'],
              'brand' => $filters['brand'],
              'min' => $filters['min'],
              'max' => $filters['max'],
              'sort' => $filters['sort'],
              'available' => $filters['available'] ? '1' : '',
          ]), 'shop') ?>
        <?php endif; ?>
      </div>
    </div>
  </div>
</section>
