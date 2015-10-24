from django.db import models

class Room(models.Model):
    room_code = models.CharField(max_length=255, default='', primary_key=True)
    creator_player_id = models.CharField(max_length=255, default='')
    match_id = models.IntegerField(default=0, blank=True, null=True)

    created = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    modified = models.DateTimeField(auto_now=True, blank=True, null=True)

    def __unicode__(self):
        return u'%s' % (self.name)

    class Meta:
        verbose_name = 'Room'
        verbose_name_plural = 'Rooms'
        app_label = "api"

class Match(models.Model):
    room_code = models.CharField(max_length=255, default='')
    creator_player_id = models.CharField(max_length=255, default='')
    match_started = models.BooleanField(default=False)

    match_start = models.DateTimeField(blank=True, null=True)
    match_countdown = models.IntegerField(default=10, blank=True, null=True) #countdown in seconds to start of match
    match_length = models.IntegerField(default=15, blank=True, null=True) #Length of match in minutes

    created = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    modified = models.DateTimeField(auto_now=True, blank=True, null=True)

    def __unicode__(self):
        return u'%s' % (self.name)

    class Meta:
        verbose_name = 'Match'
        verbose_name_plural = 'Matches'
        app_label = "api"

class Player(models.Model):
    player_id = models.CharField(max_length=255, default='', primary_key=True)
    alias = models.CharField(max_length=255, default='')
    room_code = models.CharField(max_length=255, default='')
    last_ping = models.DateTimeField(blank=True, null=True)
    score = models.IntegerField(default=0, blank=True, null=True)

    created = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    modified = models.DateTimeField(auto_now=True, blank=True, null=True)

    def __unicode__(self):
        return u'%s' % (self.name)

    class Meta:
        verbose_name = 'Player'
        verbose_name_plural = 'Players'
        app_label = "api"

class Hit(models.Model):
    from_player_id = models.CharField(max_length=255, default='')
    to_player_id = models.CharField(max_length=255, default='')
    client_hit_id = models.CharField(max_length=255, default='')
    room_code = models.CharField(max_length=255, default='')
    match_id = models.IntegerField(default=0, blank=True, null=True)
    shot_location_CHOICES = (
        ('chest', 'Chest'),
        ('shoulder', 'Shoulder'),
        ('back', 'Back'),
    )
    shot_location = models.CharField(max_length=255, choices=shot_location_CHOICES, default="chest")
    time = models.DateTimeField(blank=True, null=True)

    def __unicode__(self):
        return u'%s' % (self.name)

    class Meta:
        verbose_name = 'Player'
        verbose_name_plural = 'Players'
        app_label = "api"