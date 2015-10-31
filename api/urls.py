from django.conf.urls import patterns, url

urlpatterns = patterns('',
    url(r'^$', "api.views.homepage"),
    url(r'^create_or_join_room$', "api.views.create_or_join_room"),
    url(r'^add_player_to_room$', "api.views.add_player_to_room"),
    url(r'^get_match_details$', "api.views.get_match_details"),
    url(r'^start_match$', "api.views.start_match"),
    url(r'^end_match$', "api.views.end_match"),
    url(r'^email_me_game_results$', "api.views.email_me_game_results"),
)