var poll_match_settimeout;
var shot_locations = ["chest", "shoulder", "back"];
var hits_received;
var other_players_in_room;
var player_lives;
var match_lives;

function reset_room() {
    localStorage.removeItem("room_id");
    other_players_in_room = [];
    player_lives = -1;
    hits_received = {};
    match_lives = 0;
}

reset_room();

function leave_room() {
    if (confirm("Are you sure you want to leave the room?")) {
        clearTimeout(poll_match_settimeout);
        $("#mainnavbar_button").click();
        reset_room();

        $(".leave_room_action").addClass('hide-me');
        $(".receive_fake_hit_action").addClass('hide-me');
        $(".send_fake_shot_action").addClass('hide-me');
        $(".end_match_action").addClass('hide-me');
        cleanup_navbar();

        $(".full_page").addClass('hide-me');
        $("#create_or_join_room_div").removeClass('hide-me');
    }
}

function end_match() {
    if (confirm("Are you sure? This will reset all scores.")) {
        jQuery.ajax({
            url: "/end_match",
            dataType: "json",
            type: "POST",
            data: {
                room_code: localStorage.getItem("room_code"),
            },
            error: function (e) {
                console.log("error", e);
                alert("Error while trying to end match!");
            },
            success:function (data) {
                $(".receive_fake_hit_action").addClass('hide-me');
                $(".send_fake_shot_action").addClass('hide-me');
                $(".end_match_action").addClass('hide-me');
                cleanup_navbar();

                $(".full_page").addClass('hide-me');
                $("#waiting_for_match_to_start").removeClass('hide-me');

                if (data.creator_player_id == localStorage.getItem("player_id")) {
                    $("#waiting_for_match_to_start_admin").removeClass('hide-me');
                }
                else {
                    $("#waiting_for_match_to_start_admin").addClass('hide-me');
                }
                poll_match();
            }
        });
    }
}

function process_hit(player_id, shot_location) {
    var hit_info = {
        "player_id": player_id,
        "time": Math.floor(new Date().getTime()/1000),
        "shot_location": shot_location
    };
    console.log("process_hit", hit_info)

    hits_received[makeid()] = hit_info;
}

function receive_fake_hit() {
    if (other_players_in_room.length) {
        var player_id = other_players_in_room[Math.floor(Math.random() * other_players_in_room.length)];
        var shot_location = shot_locations[Math.floor(Math.random() * shot_locations.length)];
        process_hit(player_id, shot_location);
        $("#mainnavbar_button").click();
        var audio = new Audio('/static/gothit.mp3');
        audio.play();
    }
    else {
        alert("No other players in the room!");
    }
}

function send_fake_shot() {
    console.log("todo send_fake_shot");
    var audio = new Audio('/static/firegun.mp3');
    audio.play();
}

function cleanup_navbar() {
    if ($("#navbar").find('ul').children().not('.hide-me').length > 0) {
        $('#navbar').removeClass('hide-me');
        $('#mainnavbar_button').removeClass('hide-me');
    }
    else {
        $('#navbar').addClass('hide-me');
        $('#mainnavbar_button').addClass('hide-me');
    }
}

function poll_match() {
    clearTimeout(poll_match_settimeout);
    if (localStorage.getItem("room_code")) {
        jQuery.ajax({
            url: "/get_match_details",
            dataType: "json",
            type: "POST",
            data: {
                room_code: localStorage.getItem("room_code"),
                hits_received: JSON.stringify(hits_received)
            },
            error: function (e) {
                if (e.responseJSON && e.responseJSON.message) {
                    alert(e.responseJSON.message);
                }
                else {
                    console.log("error trying to poll match", e);
                    //alert("Error while trying to poll match");
                }
            },
            success:function (data) {
                $(".waiting_for_match_num_players").text(data.data.number_of_players);
                var poll_match_delay = 3000;

                if (data.received_hit_ids) {
                    for (var i=0; i<data.received_hit_ids.length; i++) {
                        delete hits_received[data.received_hit_ids[i]];
                    }
                }

                if (data.data.match_in_progress) {

                    //Navbar updates
                    if (data.data.creator_player_id == localStorage.getItem("player_id")) {
                        $(".end_match_action").removeClass('hide-me');
                    }
                    else {
                        $(".end_match_action").addClass('hide-me');
                    }
                    $(".receive_fake_hit_action").removeClass('hide-me');
                    $(".send_fake_shot_action").removeClass('hide-me');
                    cleanup_navbar();
                    //End navbar updates

                    $(".match_rules_length").text(data.data.match_length + " minutes");

                    match_lives = data.data.lives_per_spawn;

                    var scores_htmlz = "";
                    other_players_in_room = [];
                    for (var i=0; i<data.data.players.length; i++) {
                        if (data.data.players[i]['player_id'] == localStorage.getItem("player_id")) {
                            $("#player_score").text(data.data.players[i]['score']);
                            scores_htmlz += '<tr bgcolor="#add8e6">';
                            $(".current_player_name").html(data.data.players[i]['alias']);
                        }
                        else {
                            other_players_in_room.push(data.data.players[i]['player_id']);
                            scores_htmlz += '<tr>';
                        }
                        scores_htmlz += '<th scope="row">'+(i+1)+'</th><td>'+data.data.players[i]['alias']+'</td><td>'+data.data.players[i]['score']+'</td></tr>';
                    }
                    $("#match_in_progress_scores").html(scores_htmlz);
                    var countdown_seconds_left = data.data.match_countdown - data.data.match_seconds_elapsed;
                    $("#match_begins_timer").text(countdown_seconds_left);
                    if (data.data.match_seconds_left > 0) {
                        var match_time_left_seconds = (data.data.match_seconds_left % 60).toString();
                        if (match_time_left_seconds.length == 1) {
                            match_time_left_seconds = "0" + match_time_left_seconds;
                        }
                        var match_time_left_minutes = (Math.floor(data.data.match_seconds_left / 60)).toString();
                        $(".match_time_left").text(match_time_left_minutes + ":" + match_time_left_seconds);
                    }
                    else {
                        $(".match_time_left").text("Game Over!");
                    }
                    if (countdown_seconds_left > 0) {
                        if ($('#match_about_to_start').hasClass('hide-me')) {
                            $("#match_about_to_start").removeClass('hide-me');
                            $("#waiting_for_match_to_start_admin").addClass('hide-me');
                        }
                        poll_match_delay = 800;
                    }
                    else {
                        if ($('#match_in_progress').hasClass('hide-me')) {
                            $(".full_page").addClass('hide-me');
                            $("#match_in_progress").removeClass('hide-me');
                        }
                    }
                }
                else {
                    //Navbar updates
                    $(".end_match_action").addClass('hide-me');
                    $(".receive_fake_hit_action").addClass('hide-me');
                    $(".send_fake_shot_action").addClass('hide-me');
                    cleanup_navbar();
                    //End navbar updates

                    //match not in progress

                    var players_ids = [];
                    var scores_htmlz = "";
                    for (var i=0; i<data.data.players.length; i++) {
                        players_ids.push(data.data.players[i]['player_id']);
                        if (data.data.players[i]['player_id'] == localStorage.getItem("player_id")) {
                            $("#player_score").text(data.data.players[i]['score']);
                            scores_htmlz += '<li bgcolor="#add8e6">';
                        }
                        else {
                            scores_htmlz += '<li>';
                        }
                        scores_htmlz += data.data.players[i]['alias']+'</li>';
                    }
                    $("#match_waiting_to_start").html(scores_htmlz);
                    $(".number_of_players").html(data.data.players.length);

                }

                if (localStorage.getItem("room_code")) {
                    clearTimeout(poll_match_settimeout);
                    poll_match_settimeout = setTimeout("poll_match()", poll_match_delay);
                }
            }
        });
    }
}

function start_match() {
    var post_data = {
        room_code: localStorage.getItem("room_code"),
        match_countdown: jQuery("#match_config_countdown").val(),
        match_length: jQuery("#match_config_length").val(),
    };
    if (!parseInt(post_data['match_countdown'])) {
        post_data['match_countdown'] = 10;
    }
    if (!parseInt(post_data['match_length'])) {
        post_data['match_length'] = 15;
    }
    jQuery.ajax({
        url: "/start_match",
        dataType: "json",
        type: "POST",
        data: post_data,
        error: function (e) {
            console.log("error", e);
            alert("Error while trying to start match!");
        },
        success:function (data) {
            poll_match();
        }
    });
}

function create_or_join_room_submit() {
    if (!jQuery("#game_pin").val()) {
        alert("Must enter game pin!");
    }
    else {
        $(".full_page").addClass('hide-me');
        jQuery.ajax({
            url: "/create_or_join_room",
            dataType: "json",
            type: "POST",
            data: {
                room_code: jQuery("#game_pin").val(),
                player_name: jQuery("#player_name").val()
            },
            error: function (e) {
                if (e.responseJSON && e.responseJSON.message) {
                    alert(e.responseJSON.message);
                }
                else {
                    console.log("error", e);
                    alert("Error while trying to create room");
                }
                $("#create_or_join_room_div").removeClass('hide-me');
            },
            success:function (data) {
                $(".leave_room_action").removeClass('hide-me');
                cleanup_navbar();
                localStorage.setItem("player_name", data.data.player_name);
                localStorage.setItem("room_code", data.data.room_code);
                localStorage.setItem("player_id", data.data.player_id);

                $("#waiting_for_match_to_start").removeClass('hide-me');
                if (data.data.creator_player_id == localStorage.getItem("player_id")) {
                    $("#waiting_for_match_to_start_admin").removeClass('hide-me');
                }
                else {
                    $("#waiting_for_match_to_start_admin").addClass('hide-me');
                }
                poll_match();
            }
        });
    }
}

function receive_bluetooth_data(data) {
    console.log("RECEIVED BLUETOOTH DATA:", data);
}

function send_bluetooth_data(data) {
    var success = function() {
        console.log("Sent bluetooth data:", data);
    };

    var failure = function() {
        console.log("Failure attempting to send bluetooth data:", data);
    };

    bluetoothSerial.write(data, success, failure);
}

function connect_bluetooth() {
    bluetoothSerial.subscribe('\n', receive_bluetooth_data, generalError);
    console.log("Connecting to bluetooth device");
}

function update_bluetooth_device_list(devices) {
    console.log("updating bluetooth device list", devices);
    var htmlz = "";
    devices.forEach(function(device) {
        htmlz += '<button type="button" class="list-group-item" onclick="bluetoothSerial.connect(\''+device.address+'\', connect_bluetooth, generalError);">'+device.name+' ('+device.address+')</button>';
    });
    console.log(htmlz);
    $("#bluetooth_device_list").html(htmlz);
}

function generalError(reason) {
    alert("ERROR: " + reason);
}

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },

    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
        console.log("Device is now ready");
        bluetoothSerial.list(update_bluetooth_device_list, generalError);
    },
};
