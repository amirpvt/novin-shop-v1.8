<?php
$inStock = product_in_stock($product);
$hasDiscount = product_has_discount($product);
?>
<section class="page">
  <div class="container">
    <div class="crumbs">
      <a href="<?= e(url('')) ?>">خانه</a> /
      <a href="<?= e(url('shop')) ?>">فروشگاه</a> /
      <a href="<?= e(url('shop', ['category' => $product['category_slug'] ?? ''])) ?>"><?= e($product['category_name'] ?? '') ?></a>
    </div>
    <div class="product-hero">
      <img class="cover" src="<?= e(media_url($product['image'])) ?>" alt="<?= e($product['alt_text'] ?: $product['name']) ?>">
      <div class="panel stack">
        <div class="meta-row">
          <span class="pill"><?= e($product['category_name'] ?? '') ?></span>
          <?php if (!empty($product['brand_name'])): ?><span class="tiny"><?= e($product['brand_name']) ?></span><?php endif; ?>
        </div>
        <h1 class="page-title"><?= e($product['name']) ?></h1>
        <div><?= nl($product['description'] ?: '') ?></div>
        <div class="meta-row">
          <span class="pill"><?= e(unit_label($product['retail_unit'] ?: $product['unit'])) ?></span>
          <?= $inStock ? '<span class="stock-ok">موجود در انبار: ' . (int) $product['stock'] . '</span>' : '<span class="stock-no">ناموجود</span>' ?>
        </div>
        <div>
          <?php if ($hasDiscount): ?><div class="price-old"><?= e(money($product['price'])) ?></div><?php endif; ?>
          <div class="price" style="font-size:28px"><?= e(money(product_effective_price($product))) ?></div>
        </div>
        <form class="line" method="post" action="<?= e(url('cart/add')) ?>">
          <?= csrf_field() ?>
          <input type="hidden" name="product_id" value="<?= (int) $product['id'] ?>">
          <input type="hidden" name="back" value="<?= e('/product/' . $product['slug']) ?>">
          <input class="qty" style="width:90px" type="number" name="qty" min="1" max="<?= max(1, (int) $product['stock']) ?>" value="1">
          <button class="btn btn-primary" type="submit" <?= $inStock ? '' : 'disabled' ?>>افزودن به سبد</button>
        </form>
        <?php if (wholesale_is_open()): ?>
          <div class="info-card">
            <strong>خرید عمده</strong>
            <p class="tiny">حداقل <?= (int) $product['wholesale_min_quantity'] ?> <?= e(unit_label($product['wholesale_unit'])) ?></p>
            <form method="post" action="<?= e(url('wholesale/add')) ?>" class="stack">
              <?= csrf_field() ?>
              <input type="hidden" name="product_id" value="<?= (int) $product['id'] ?>">
              <input type="hidden" name="back" value="/wholesale">
              <?php if (!empty($product['options'])): ?>
                <select name="option_id">
                  <?php foreach ($product['options'] as $opt): ?>
                    <option value="<?= (int) $opt['id'] ?>"><?= e($opt['label']) ?> — <?= e(money($opt['unit_price'])) ?></option>
                  <?php endforeach; ?>
                </select>
              <?php else: ?>
                <input type="hidden" name="option_id" value="0">
                <div>قیمت عمده: <?= e(money(product_effective_price($product))) ?></div>
              <?php endif; ?>
              <input type="number" name="qty" min="<?= (int) $product['wholesale_min_quantity'] ?>" value="<?= (int) $product['wholesale_min_quantity'] ?>">
              <button class="btn btn-dark" type="submit">افزودن به سفارش عمده</button>
            </form>
          </div>
        <?php endif; ?>
      </div>
    </div>
    <?php if ($related): ?>
      <h2 class="section-title">محصولات مرتبط</h2>
      <div class="product-grid">
        <?php foreach ($related as $product): ?>
          <?php require base_dir() . '/views/partials/product_card.php'; ?>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>
</section>
