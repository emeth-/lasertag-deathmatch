# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_auto_20151024_2103'),
    ]

    operations = [
        migrations.RenameField(
            model_name='match',
            old_name='match_started',
            new_name='match_in_progress',
        ),
    ]
