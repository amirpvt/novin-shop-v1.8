from django.db import models


class Testimonial(models.Model):
    name = models.CharField("نام", max_length=120)
    role = models.CharField("نقش / شهر", max_length=160, blank=True)
    text = models.TextField("متن نظر")
    avatar = models.CharField("حرف آواتار", max_length=4, blank=True)
    approved = models.BooleanField("تایید شده", default=False)
    created_at = models.DateTimeField("تاریخ ایجاد", auto_now_add=True)

    class Meta:
        verbose_name = "نظر"
        verbose_name_plural = "نظرات"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}: {self.text[:30]}"
