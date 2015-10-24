from django.http import HttpResponse
import datetime
import json
from api.models import Room, Player, Hit, Match
import random
from django.db.models import F

animal_names = ['Alligator', 'Antelope', 'Armadillo', 'Badger', 'Bat', 'Bear', 'Beaver', 'Bee', 'Bison', 'Butterfly', 'Camel', 'Cat', 'Coyote', 'Crow', 'Deer', 'Dinosaur', 'Dog', 'Dolphin', 'Donkey', 'Duck', 'Eagle', 'Eel', 'Elephant', 'Elk', 'Ferret', 'Fish', 'Fox', 'Frog', 'Giraffe', 'Goat', 'Goose', 'Gorilla', 'Hawk', 'Horse', 'Hyena', 'Jellyfish', 'Kangaroo', 'Koala', 'Leopard', 'Lion', 'Llama', 'Monkey', 'Nightingale', 'Owl', 'Otter', 'Ostrich', 'Ox', 'Panda', 'Parrot', 'Quail', 'Rabbit', 'Raccoon', 'Rhino', 'Seal', 'Shark', 'Sheep', 'Squirrel', 'Tiger', 'Turkey', 'Turtle', 'Walrus', 'Wolf', 'Zebra']

def create_room(request):
    """
    request.POST = {
        "player_id": "<>",
        "room_code": "<>",
        "locked_down": False
    }
    """
    if Room.objects.filter(room_code=request.POST['room_code']).exists():
        return HttpResponse(json.dumps({
            "status": "error",
            "message": "Room already exists with that code."
        }, default=json_custom_parser), content_type='application/json', status=400)

    Room.objects.filter(creator_player_id=request.POST['player_id']).delete()
    new_room = Room(**{
        "room_code": request.POST['room_code'],
        "creator_player_id": request.POST['player_id'],
    })
    new_room.save()

    new_player = Player(**{
        "room_code": request.POST['room_code'],
        "player_id": request.POST['player_id'],
        "alias": random.choice(animal_names)
    })
    new_player.save()

    return HttpResponse(json.dumps({
        "status": "success",
        "data": {
            "room_code": new_room.room_code,
            "creator_player_id": new_room.creator_player_id,
        }
    }, default=json_custom_parser), content_type='application/json', status=200)

def add_player_to_room(request):

    try:
        r = Room.objects.get(room_code=request.POST['room_code'])
    except Room.DoesNotExist:
        return HttpResponse(json.dumps({
            "status": "error",
            "message": "Room does not exist."
        }, default=json_custom_parser), content_type='application/json', status=400)
    
    new_player = Player(**{
        "room_code": r.room_code,
        "player_id": request.POST['player_id'],
        "alias": random.choice(animal_names)
    })
    new_player.save()
    return HttpResponse(json.dumps({
        "status": "success",
        "data": {
            "room_code": r.room_code,
            "creator_player_id": r.creator_player_id,
        }
    }, default=json_custom_parser), content_type='application/json', status=200)

def get_match_details(request):
    """
        Returns current match scoreboard.
        Also receives (as a json array) info on all hits/shots taken by the user
        request.POST = {
            "room_code": "<>",
            "player_id": "<>",
            "shots_taken": <number>,
            "hits_received": {
                    <hit_id>: {
                        "player_id": "<>",
                        "time": <>,
                        "shot_location": ""
                    }
                },
                ...
            ] #JSON STRING
        }
    """
    r = Room.objects.get(room_code=request.POST['room_code'])
    p = Player.objects.get(room_code=request.POST['room_code'], player_id=request.POST['player_id'])
    p.last_ping = datetime.datetime.now()
    p.save()
    
    received_hit_ids = []
    if 'hits_received' in request.POST and r.match_id:
        previously_received_hits = {}
        for h in Hit.objects.filter(room_code=r.room_code, match_id=r.match_id, to_player_id=p.player_id).values('client_hit_id'):
            previously_received_hits[h['client_hit_id']] = 1
        for hit_id, hit_data in json.loads(request.POST['hits_received']).items():
            received_hit_ids.append(hit_id)
            if hit_id not in previously_received_hits:
                #if p.player_id != hit_data['player_id']: #Ensure player didn't shoot themselves
                new_hit = Hit(**{
                    "client_hit_id": hit_id,
                    "to_player_id": p.player_id,
                    "from_player_id": hit_data['player_id'],
                    "room_code": r.room_code,
                    "match_id": r.match_id,
                    "shot_location": hit_data['shot_location'],
                    "time": datetime.datetime.fromtimestamp(hit_data['time']),
                })
                new_hit.save()
                score_increase = 0
                if hit_data['shot_location'] == "chest":
                    score_increase += 1
                elif hit_data['shot_location'] == "shoulder":
                    score_increase += 2
                elif hit_data['shot_location'] == "back":
                    score_increase += 3
                Player.objects.filter(room_code=r.room_code, player_id=p.player_id).update(score=F('score') + score_increase)

    all_players = Player.objects.filter(room_code=r.room_code).order_by('-score')
    match_details = {
        "players": [],
        "number_of_players": len(all_players),
        "match_in_progress": False,
        "creator_player_id": r.creator_player_id
    }

    try:
        m = Match.objects.get(id=r.match_id)
        match_details['match_in_progress'] = m.match_in_progress
        match_details['match_countdown'] = m.match_countdown
        match_details['match_seconds_elapsed'] = int((datetime.datetime.now()-m.match_start).total_seconds())
        match_details['match_seconds_left'] = m.match_length*60 - match_details['match_seconds_elapsed']
        match_details['match_length'] = m.match_length

    except Match.DoesNotExist:
        pass

    for p in all_players:
        match_details['players'].append({
            "player_id": p.player_id,
            "alias": p.alias,
            "last_ping": p.last_ping,
            "score": p.score
        })

    return HttpResponse(json.dumps({
        "status": "success",
        "data": match_details,
        "received_hit_ids": received_hit_ids
    }, default=json_custom_parser), content_type='application/json', status=200)

def start_match(request):
    """
        Admin manually triggers match start.
    """
    r = Room.objects.get(room_code=request.POST['room_code'])
    p = Player.objects.get(room_code=request.POST['room_code'], player_id=request.POST['player_id'])
    if r.creator_player_id != p.player_id:
        return HttpResponse(json.dumps({
            "status": "error",
            "message": "You are not the creator/admin of that room."
        }, default=json_custom_parser), content_type='application/json', status=400)

    new_match = Match(**{
        "room_code": r.room_code,
        "creator_player_id": r.creator_player_id,
        "match_countdown": request.POST['match_countdown'],
        "match_length": request.POST['match_length'],
        "match_start": datetime.datetime.now(),
        "match_in_progress": True
    })
    new_match.save()

    r.match_id = new_match.id
    r.save()

    return HttpResponse(json.dumps({
        "status": "success"
    }, default=json_custom_parser), content_type='application/json', status=200)

def end_match(request):
    """
        Admin manually triggers match end.
    """
    r = Room.objects.get(room_code=request.POST['room_code'])
    p = Player.objects.get(room_code=request.POST['room_code'], player_id=request.POST['player_id'])
    if r.creator_player_id == p.player_id:
        Match.objects.filter(id=r.match_id).update(match_in_progress=False)
        r.match_id = None
        r.save()
    Player.objects.filter(room_code=r.room_code, player_id=p.player_id).update(score=0)

    return HttpResponse(json.dumps({
        "status": "success",
        "creator_player_id": r.creator_player_id
    }, default=json_custom_parser), content_type='application/json', status=200)

def email_me_game_results(request):
    #TODO
    return HttpResponse(json.dumps({
        "status": "success"
    }, default=json_custom_parser), content_type='application/json', status=200)


def json_custom_parser(obj):
    if isinstance(obj, datetime.datetime) or isinstance(obj, datetime.date):
        dot_ix = 19
        return obj.isoformat()[:dot_ix]
    else:
        raise TypeError(obj)


"""
GRAND IDEAS:
- Create hardware piece that basically a vest only. It's a "reload" / "revive" thing, you have to go back to it and shoot it to either reload or revive.
- Allow players not in a room to shoot other players to join their room.
- In master menu
    - Normal Users
        - LEAVE ROOM (if not locked, in which case only an admin can cause them all to leave room)
        - View gametype rules
        - Scoreboard
    - Admin Users (in addition to above)
        - End Match (with confirm)
"""