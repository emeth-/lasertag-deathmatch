# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Hit',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('from_player_id', models.CharField(default=b'', max_length=255)),
                ('to_player_id', models.CharField(default=b'', max_length=255)),
                ('room_code', models.CharField(default=b'', max_length=255)),
                ('match_id', models.IntegerField(default=0, null=True, blank=True)),
                ('shot_location', models.CharField(default=b'chest', max_length=255, choices=[(b'chest', b'Chest'), (b'shoulder', b'Shoulder'), (b'back', b'Back')])),
                ('time', models.DateTimeField(null=True, blank=True)),
            ],
            options={
                'verbose_name': 'Player',
                'verbose_name_plural': 'Players',
            },
        ),
        migrations.CreateModel(
            name='Match',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('room_code', models.CharField(default=b'', max_length=255)),
                ('creator_player_id', models.CharField(default=b'', max_length=255)),
                ('lives_per_spawn', models.IntegerField(default=1, null=True, blank=True)),
                ('respawn_timer', models.IntegerField(default=5, null=True, blank=True)),
                ('gametype', models.CharField(default=b'deathmatch', max_length=255, choices=[(b'deathmatch', b'Deathmatch'), (b'team_deathmatch', b'Team Deathmatch')])),
                ('match_started', models.BooleanField(default=False)),
                ('match_countdown_start', models.DateTimeField(null=True, blank=True)),
                ('match_countdown', models.IntegerField(default=10, null=True, blank=True)),
                ('created', models.DateTimeField(auto_now_add=True, null=True)),
                ('modified', models.DateTimeField(auto_now=True, null=True)),
            ],
            options={
                'verbose_name': 'Match',
                'verbose_name_plural': 'Matches',
            },
        ),
        migrations.CreateModel(
            name='Player',
            fields=[
                ('player_id', models.CharField(default=b'', max_length=255, serialize=False, primary_key=True)),
                ('alias', models.CharField(default=b'', max_length=255)),
                ('room_code', models.CharField(default=b'', max_length=255)),
                ('last_ping', models.DateTimeField(null=True, blank=True)),
                ('created', models.DateTimeField(auto_now_add=True, null=True)),
                ('modified', models.DateTimeField(auto_now=True, null=True)),
            ],
            options={
                'verbose_name': 'Player',
                'verbose_name_plural': 'Players',
            },
        ),
        migrations.CreateModel(
            name='Room',
            fields=[
                ('room_code', models.CharField(default=b'', max_length=255, serialize=False, primary_key=True)),
                ('creator_player_id', models.CharField(default=b'', max_length=255)),
                ('match_id', models.IntegerField(default=0, null=True, blank=True)),
                ('created', models.DateTimeField(auto_now_add=True, null=True)),
                ('modified', models.DateTimeField(auto_now=True, null=True)),
            ],
            options={
                'verbose_name': 'Room',
                'verbose_name_plural': 'Rooms',
            },
        ),
    ]
