# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_player_score'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='match',
            name='gametype',
        ),
        migrations.RemoveField(
            model_name='match',
            name='lives_per_spawn',
        ),
        migrations.RemoveField(
            model_name='match',
            name='respawn_timer',
        ),
    ]
