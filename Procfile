web: gunicorn guardProj.wsgi:application --workers 4
worker: celery -A guardProj worker --loglevel=info
release: python manage.py migrate