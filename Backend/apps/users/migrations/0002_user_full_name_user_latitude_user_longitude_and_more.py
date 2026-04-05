# This migration is intentionally left empty.
# Its content was squashed into 0001_initial.py to fix the bigint->uuid cast error.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        # All fields from the original 0002 are now in 0001_initial
    ]
