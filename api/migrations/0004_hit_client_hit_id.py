# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_auto_20150629_1825'),
    ]

    operations = [
        migrations.AddField(
            model_name='hit',
            name='client_hit_id',
            field=models.CharField(default=b'', max_length=255),
        ),
    ]
