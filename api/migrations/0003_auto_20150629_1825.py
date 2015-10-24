# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_match_match_length'),
    ]

    operations = [
        migrations.RenameField(
            model_name='match',
            old_name='match_countdown_start',
            new_name='match_start',
        ),
    ]
