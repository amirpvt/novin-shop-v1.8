<section class="hero" style="min-height:46vh">
  <img class="hero-slide is-active" src="<?= e(asset('images/banners/b (5).jpg')) ?>" alt="">
  <div class="hero-shade"></div>
  <div class="hero-copy">
    <span class="kicker">درباره مجموعه</span>
    <h1>درباره <?= e(setting('site_name')) ?></h1>
    <p>بیش از دو دهه تجربه در توزیع فرآورده‌های غذایی و گوشتی</p>
  </div>
</section>
<section class="page">
  <div class="container split">
    <div class="stack">
      <p><strong><?= e(setting('site_name')) ?></strong> با سابقه درخشان در توزیع مواد غذایی، امروز یکی از شبکه‌های پخش فرآورده‌های گوشتی، سس، نوشیدنی و اقلام همراه فست‌فود است. <?= e(setting('site_slogan')) ?></p>
      <div class="panel">
        <h2>آدرس فروشگاه</h2>
        <p><?= e(setting('address')) ?></p>
      </div>
      <div class="form-grid two">
        <a class="panel" href="tel:<?= e(setting('phone_fixed')) ?>"><span class="tiny">تلفن ثابت</span><strong class="num"><?= e(setting('phone_fixed')) ?></strong></a>
        <a class="panel" href="tel:<?= e(setting('phone_mobile')) ?>"><span class="tiny">همراه</span><strong class="num"><?= e(setting('phone_mobile')) ?></strong></a>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><b>+20</b>سال سابقه</div>
      <div class="stat"><b>+40</b>نوع محصول</div>
      <div class="stat"><b>+1000</b>مشتری فعال</div>
      <div class="stat"><b>31</b>استان تحت پوشش</div>
    </div>
  </div>
  <div class="container">
    <h2 class="section-title">برندهای همکار</h2>
    <div class="brand-row">
      <?php foreach ($brands as $brand): ?>
        <a class="brand-card" href="<?= e(url('shop', ['brand' => $brand['slug']])) ?>">
          <?php if ($brand['logo']): ?><img src="<?= e(media_url($brand['logo'])) ?>" alt="<?= e($brand['name']) ?>"><?php else: ?><div class="letter"><?= e(mb_substr($brand['name'], 0, 1)) ?></div><?php endif; ?>
          <strong><?= e($brand['name']) ?></strong>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</section>
