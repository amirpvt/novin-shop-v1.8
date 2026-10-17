<?php
$inStock = product_in_stock($product);
$hasDiscount = product_has_discount($product);
?>
<article class="product-card">
  <a class="product-media" href="<?= e(url('product/' . $product['slug'])) ?>">
    <img src="<?= e(media_url($product['image'] ?? '')) ?>" alt="<?= e($product['name']) ?>">
  </a>
  <div class="product-body">
    <div class="meta-row">
      <span class="tiny"><?= e($product['category_name'] ?? '') ?></span>
      <span class="tiny"><?= e($product['brand_name'] ?? '') ?></span>
    </div>
    <h3><a href="<?= e(url('product/' . $product['slug'])) ?>"><?= e($product['name']) ?></a></h3>
    <p><?= e($product['description'] ?: $product['name']) ?></p>
    <div class="meta-row">
      <span class="pill"><?= e(unit_label($product['retail_unit'] ?? $product['unit'] ?? '')) ?></span>
      <?php if (!$inStock): ?><span class="stock-no">ناموجود</span><?php else: ?><span class="stock-ok">موجود</span><?php endif; ?>
    </div>
    <?php if (!empty($product['tag'])): ?><span class="pill red"><?= e(tag_label($product['tag'])) ?></span><?php endif; ?>
    <div class="price-row">
      <div>
        <?php if ($hasDiscount): ?><div class="price-old num"><?= e(money($product['price'])) ?></div><?php endif; ?>
        <div class="price"><?= e(money(product_effective_price($product))) ?></div>
      </div>
      <?php if ($hasDiscount): ?><span class="pill hot"><?= (int) product_discount_percent($product) ?>%</span><?php endif; ?>
    </div>
    <form method="post" action="<?= e(url('cart/add')) ?>">
      <?= csrf_field() ?>
      <?= back_field() ?>
      <input type="hidden" name="product_id" value="<?= (int) $product['id'] ?>">
      <input type="hidden" name="qty" value="1">
      <button class="btn btn-primary btn-block" type="submit" <?= $inStock ? '' : 'disabled' ?>><?= $inStock ? 'افزودن به سبد' : 'ناموجود' ?></button>
    </form>
  </div>
</article>
