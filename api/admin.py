from django.contrib import admin

from api.models import Room
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_code', )
    search_fields = ('room_code',)
admin.site.register(Room, RoomAdmin)

from api.models import Match
class MatchAdmin(admin.ModelAdmin):
    list_display = ('room_code', 'gametype', 'match_started')
    search_fields = ('room_code',)
admin.site.register(Match, MatchAdmin)

from api.models import Player
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('room_code', 'player_id')
    search_fields = ('room_code', 'player_id')
admin.site.register(Player, PlayerAdmin)

from api.models import Hit
class HitAdmin(admin.ModelAdmin):
    list_display = ('room_code', 'from_player_id', 'to_player_id', 'shot_location', 'time')
    search_fields = ('room_code', 'from_player_id', 'to_player_id')
admin.site.register(Hit, HitAdmin)
