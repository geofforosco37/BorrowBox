from django.shortcuts import render
from django.db.models import Q, Count
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import Category, BorrowItem
from .serializers import CategorySerializer, BorrowItemSerializer
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
class BorrowItemViewSet(viewsets.ModelViewSet):
    queryset = BorrowItem.objects.all()
    serializer_class = BorrowItemSerializer
    def get_queryset(self):
        queryset = BorrowItem.objects.all()
        category = self.request.query_params.get('category', None)
        status_param = self.request.query_params.get('status', None)
        search = self.request.query_params.get('search', None)
        condition = self.request.query_params.get('condition', None)
        if category:
            if category.isdigit():
                queryset = queryset.filter(category_id=category)
            else:
                queryset = queryset.filter(category__name__iexact=category)
        if status_param and status_param.upper() != 'ALL':
            queryset = queryset.filter(status__iexact=status_param)
        if condition:
            conds = [c.strip() for c in condition.split(',') if c.strip()]
            queryset = queryset.filter(condition__in=conds)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(borrower_name__icontains=search) |
                Q(borrower_email__icontains=search) |
                Q(item_code__icontains=search) |
                Q(notes__icontains=search)
            )
        return queryset
    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_items = BorrowItem.objects.count()
        borrowed = BorrowItem.objects.filter(status='BORROWED').count()
        available = BorrowItem.objects.filter(status='AVAILABLE').count()
        maintenance = BorrowItem.objects.filter(status='MAINTENANCE').count()
        reserved = BorrowItem.objects.filter(status='RESERVED').count()
        return Response({
            'total_items': total_items,
            'borrowed_items': borrowed,
            'available_items': available,
            'maintenance_items': maintenance,
            'reserved_items': reserved,
        })
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        item = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            item.status = new_status
            if new_status == 'AVAILABLE':
                item.borrower_name = ''
                item.borrower_email = ''
                item.borrow_date = None
                item.due_date = None
            item.save()
            return Response(BorrowItemSerializer(item).data)
        return Response({'error': 'Status field is required.'}, status=status.HTTP_400_BAD_REQUEST)
def index_view(request):
    return render(request, 'index.html')
