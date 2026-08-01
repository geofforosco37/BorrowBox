import json
from django.test import TestCase, Client
from rest_framework import status
from .models import Category, BorrowItem


class BorrowItemAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.category = Category.objects.create(
            name="Coaching Staff",
            description="Coaches and assistant coaches",
            icon="whistle"
        )
        self.item = BorrowItem.objects.create(
            title="Ryan Santos",
            condition="Head Coach",
            status="AVAILABLE",
            category=self.category,
            notes="Lead strategist"
        )

    def test_list_items(self):
        response = self.client.get('/api/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        items = response.json()
        self.assertGreaterEqual(len(items), 1)

    def test_create_item(self):
        payload = {
            'title': 'Alex Vance',
            'condition': 'Player',
            'status': 'AVAILABLE',
            'notes': 'Roster recruit'
        }
        response = self.client.post('/api/items/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['title'], 'Alex Vance')
        self.assertTrue(data['item_code'].startswith('BB-'))

    def test_get_single_item(self):
        response = self.client.get(f'/api/items/{self.item.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['title'], 'Ryan Santos')

    def test_update_item(self):
        payload = {
            'title': 'Ryan Santos (Updated)',
            'condition': 'Head Coach',
            'status': 'BORROWED',
            'notes': 'Assigned to active duty'
        }
        response = self.client.put(f'/api/items/{self.item.id}/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['status'], 'BORROWED')

    def test_stats_endpoint(self):
        response = self.client.get('/api/items/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('total_items', data)
        self.assertIn('available_items', data)

    def test_delete_item(self):
        response = self.client.delete(f'/api/items/{self.item.id}/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        check = self.client.get(f'/api/items/{self.item.id}/')
        self.assertEqual(check.status_code, status.HTTP_404_NOT_FOUND)
