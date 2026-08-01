# BorrowBox Application

A Django REST Framework application for managing personnel records with full CRUD functionality.

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

3. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

4. **Open browser and navigate to:**
   ```
   http://127.0.0.1:8000
   ```

## Requirements

- Python 3.x
- Django 6.0.7
- Django REST Framework 3.17.1
- django-cors-headers 4.9.0

## Features

- Create new personnel records
- Read and display personnel data
- Update existing records
- Delete records
- Search and filter functionality
- Multiple views (Dashboard, Coach, Players, Availability)

## API Endpoints

- `GET /api/items/` - List all personnel records
- `POST /api/items/` - Create new record
- `PUT /api/items/{id}/` - Update record
- `DELETE /api/items/{id}/` - Delete record
- `GET /api/items/stats/` - Get statistics

## Troubleshooting

If you encounter issues:

1. Make sure Python is installed: `python --version`
2. Ensure all dependencies are installed: `pip install -r requirements.txt`
3. Run system check: `python manage.py check`
4. If database issues occur, delete `db.sqlite3` and run migrations again
