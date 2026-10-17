<?php $banners = $banners ?? []; ?>
<section class="hero" aria-label="بنر">
  <?php if ($banners): ?>
    <?php foreach ($banners as $i => $banner): ?>
      <img class="hero-slide <?= $i === 0 ? 'is-active' : '' ?>" data-slide src="<?= e(asset($banner)) ?>" alt="پخش سوسیس و کالباس نوین">
    <?php endforeach; ?>
  <?php endif; ?>
  <div class="hero-shade"></div>
  <div class="hero-copy">
    <span class="kicker">توزیع عمده سراسری</span>
    <h1><?= e(setting('site_name')) ?></h1>
    <p><?= e(setting('site_slogan')) ?></p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="<?= e(url('shop')) ?>">مشاهده محصولات</a>
      <a class="btn btn-gold" href="<?= e(url('wholesale')) ?>">سفارش عمده</a>
      <a class="btn btn-ghost" href="tel:<?= e(setting('phone_mobile')) ?>">سفارش تلفنی: <?= e(setting('phone_mobile')) ?></a>
    </div>
  </div>
  <?php if (count($banners) > 1): ?>
    <div class="hero-dots">
      <?php foreach ($banners as $i => $banner): ?>
        <button type="button" data-dot="<?= $i ?>" class="<?= $i === 0 ? 'is-active' : '' ?>" aria-label="تصویر <?= $i + 1 ?>"></button>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="section-kicker">بهترین‌های صنعت</span>
        <h2 class="section-title">برندهای همکار</h2>
        <p class="sub">افتخار همکاری با نام‌های معتبر در پخش عمده و خرده</p>
      </div>
    </div>
    <div class="brand-row">
      <?php foreach ($brands as $brand): ?>
        <a class="brand-card" href="<?= e(url('shop', ['brand' => $brand['slug']])) ?>">
          <?php if ($brand['logo']): ?>
            <img src="<?= e(media_url($brand['logo'])) ?>" alt="<?= e($brand['name']) ?>">
          <?php else: ?>
            <div class="letter"><?= e(mb_substr($brand['name'], 0, 1)) ?></div>
          <?php endif; ?>
          <strong><?= e($brand['name']) ?></strong>
          <span>نماینده پخش رسمی</span>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="section-kicker">کاتالوگ محصولات نوین</span>
        <h2 class="section-title">دسته‌بندی محصولات</h2>
        <p class="sub">روی هر دسته کلیک کنید تا محصولات آن را ببینید</p>
      </div>
    </div>
    <div class="cat-grid">
      <?php foreach ($categories as $cat): ?>
        <a class="cat-card" href="<?= e(url('shop', ['category' => $cat['slug']])) ?>">
          <img src="<?= e(media_url($cat['image'])) ?>" alt="<?= e($cat['name']) ?>">
          <div>
            <span class="tiny">دسته‌بندی</span>
            <strong><?= e($cat['name']) ?></strong>
            <span><?= e($cat['description']) ?></span>
          </div>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<?php if (!empty($featured)): ?>
<section class="section" style="padding-top:0">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="section-kicker">منتخب انبار</span>
        <h2 class="section-title">محصولات ویژه</h2>
      </div>
      <a class="btn btn-ghost btn-sm" href="<?= e(url('shop')) ?>">همه محصولات</a>
    </div>
    <div class="product-grid">
      <?php foreach ($featured as $product): ?>
        <?php require base_dir() . '/views/partials/product_card.php'; ?>
      <?php endforeach; ?>
    </div>
  </div>
</section>
<?php endif; ?>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="band">
      <h2 class="section-title">برای رستوران، فست‌فود و فروشگاه</h2>
      <p>ثبت درخواست عمده آنلاین است. قیمت‌های کارتن، باکس و کیس را در صفحه هر محصول می‌بینید.</p>
      <div class="btn-row" style="justify-content:flex-start">
        <a class="btn btn-primary" href="<?= e(url('wholesale')) ?>">شروع سفارش عمده</a>
        <a class="btn btn-ghost" href="<?= e(url('contact')) ?>">هماهنگی تلفنی</a>
      </div>
    </div>
  </div>
</section>
