from rest_framework import serializers
from .models import Category, BorrowItem

class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'item_count', 'created_at']

    def get_item_count(self, obj):
        return obj.items.count()

class BorrowItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default='General')
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        required=False,
        allow_null=True
    )

    class Meta:
        model = BorrowItem
        fields = [
            'id',
            'title',
            'category',
            'category_id',
            'category_name',
            'item_code',
            'borrower_name',
            'borrower_email',
            'status',
            'borrow_date',
            'due_date',
            'condition',
            'notes',
            'created_at',
            'updated_at',
        ]
        extra_kwargs = {
            'item_code': {'required': False, 'allow_blank': True},
        }
