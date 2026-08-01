from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, BorrowItemViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'items', BorrowItemViewSet, basename='borrowitem')

urlpatterns = [
    path('', include(router.urls)),
]
