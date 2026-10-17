<div class="admin-top"><h1>پیام‌ها</h1></div>
<div class="stack">
  <?php foreach ($messages as $message): ?>
    <article class="panel">
      <div class="meta-row">
        <strong><?= e($message['name']) ?></strong>
        <span class="tiny"><?= e(fa_date($message['created_at'])) ?> <?= (int) $message['is_read'] ? '' : '· جدید' ?></span>
      </div>
      <div class="tiny num"><?= e($message['phone']) ?> · <?= e($message['subject']) ?></div>
      <p><?= nl($message['body']) ?></p>
      <form method="post" action="<?= e(url('admin/message')) ?>" class="btn-row" style="justify-content:flex-start">
        <?= csrf_field() ?>
        <input type="hidden" name="id" value="<?= (int) $message['id'] ?>">
        <button class="btn btn-ghost btn-sm" name="do" value="read" type="submit">خوانده شد</button>
        <button class="btn btn-ghost btn-sm" name="do" value="delete" type="submit">حذف</button>
      </form>
    </article>
  <?php endforeach; ?>
  <?php if (!$messages): ?><div class="panel">پیامی نیست.</div><?php endif; ?>
</div>
