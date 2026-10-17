<div class="admin-top"><h1>پورسانت ویزیتورها</h1><span class="pill"><?= e((string) $percent) ?> درصد</span></div>
<div class="table-wrap panel">
  <table>
    <tr><th>ویزیتور</th><th>فروش واجد پورسانت</th><th>مانده</th><th></th></tr>
    <?php foreach ($visitors as $visitor): ?>
      <tr>
        <td><?= e($visitor['name']) ?><div class="tiny num"><?= e($visitor['phone']) ?></div></td>
        <td class="num"><?= e(money($visitor['sales'])) ?></td>
        <td class="num"><?= e(money(round(((int) $visitor['unpaid_base']) * $percent / 100))) ?></td>
        <td>
          <form method="post" action="<?= e(url('admin/commissions')) ?>"><?= csrf_field() ?>
            <input type="hidden" name="visitor_id" value="<?= (int) $visitor['id'] ?>">
            <button class="btn btn-ghost btn-sm" type="submit">تسویه</button>
          </form>
        </td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$visitors): ?><tr><td colspan="4">ویزیتوری ثبت نشده. از بخش کاربران یک کاربر با نقش ویزیتور بسازید.</td></tr><?php endif; ?>
  </table>
</div>
