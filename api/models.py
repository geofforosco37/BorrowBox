from django.db import models
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, default='')
    icon = models.CharField(max_length=50, default='box')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name

class BorrowItem(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('BORROWED', 'Borrowed'),
        ('MAINTENANCE', 'Maintenance'),
        ('RESERVED', 'Reserved'),
    ]

    title = models.CharField(max_length=150)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    item_code = models.CharField(max_length=50, unique=True, blank=True)
    borrower_name = models.CharField(max_length=100, blank=True, default='')
    borrower_email = models.EmailField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    borrow_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    condition = models.CharField(max_length=50, default='Good')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.item_code:
            last_id = BorrowItem.objects.order_by('-id').first()
            next_id = (last_id.id + 1) if last_id else 1
            self.item_code = f"BB-{next_id:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.item_code}) - {self.status}"
