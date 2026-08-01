from django.core.management.base import BaseCommand
from api.models import Category, BorrowItem


class Command(BaseCommand):
    help = 'Seeds database with initial personnel and department records'

    def handle(self, *args, **options):
        BorrowItem.objects.all().delete()
        Category.objects.all().delete()

        categories_data = [
            {'name': 'Coaching Staff', 'description': 'Head coaches, assistant coaches, and tactical analysts', 'icon': 'user-tie'},
            {'name': 'Roster Players', 'description': 'Active squad players and reserve personnel', 'icon': 'user-shield'},
            {'name': 'Support Staff', 'description': 'Physios, managers, and operational support', 'icon': 'shield'},
        ]

        category_objs = {}
        for cat in categories_data:
            obj, _ = Category.objects.get_or_create(
                name=cat['name'],
                defaults={'description': cat['description'], 'icon': cat['icon']}
            )
            category_objs[cat['name']] = obj

        personnel_data = [
            {
                'title': 'KIM "KKOMA" JEONG-GYUN',
                'category': category_objs['Coaching Staff'],
                'condition': 'Head Coach',
                'status': 'BORROWED',
                'notes': 'Head Coach - Lead Tactical Strategist',
            },
            {
                'title': 'TOM "TOM" LIM',
                'category': category_objs['Coaching Staff'],
                'condition': 'Coach',
                'status': 'BORROWED',
                'notes': 'Draft & Execution Specialist',
            },
            {
                'title': 'LEE "FAKER" SANG-HYEOK',
                'category': category_objs['Roster Players'],
                'condition': 'Player',
                'status': 'BORROWED',
                'notes': 'Mid Laner & Captain',
            },
            {
                'title': 'CHOI "ZEUS" WOO-JE',
                'category': category_objs['Roster Players'],
                'condition': 'Player',
                'status': 'BORROWED',
                'notes': 'Top Laner',
            },
            {
                'title': 'MUN "ONER" HYEON-JUN',
                'category': category_objs['Roster Players'],
                'condition': 'Player',
                'status': 'AVAILABLE',
                'notes': 'Jungler',
            },
            {
                'title': 'LEE "GUMAYUSI" MIN-HYEONG',
                'category': category_objs['Roster Players'],
                'condition': 'Player',
                'status': 'AVAILABLE',
                'notes': 'Bot Laner',
            },
            {
                'title': 'RYU "KERIA" MIN-SEOK',
                'category': category_objs['Roster Players'],
                'condition': 'Player',
                'status': 'AVAILABLE',
                'notes': 'Support Laner',
            },
            {
                'title': 'ROACH "ROACH" KANG-HEE',
                'category': category_objs['Coaching Staff'],
                'condition': 'Coach',
                'status': 'MAINTENANCE',
                'notes': 'Under Contract Review',
            },
        ]

        for i, item in enumerate(personnel_data, 1):
            BorrowItem.objects.create(
                title=item['title'],
                category=item['category'],
                item_code=f"BB-{i:04d}",
                condition=item['condition'],
                status=item['status'],
                notes=item['notes'],
            )

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded database with {len(personnel_data)} records."))
