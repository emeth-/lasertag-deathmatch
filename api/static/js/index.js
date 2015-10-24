if (!localStorage.getItem("player_id")){
    // TODO actually transfer this to server-side
    localStorage.setItem("player_id", makeid());
}
var poll_match_settimeout;
var shot_locations = ["chest", "shoulder", "back"];
var hits_received;
var other_players_in_room;
var player_lives;
var match_lives;
var match_respawn_timer;
var player_respawn_timer;

function reset_room() {
    localStorage.removeItem("room_id");
    other_players_in_room = [];
    player_lives = -1;
    hits_received = {};
    match_lives = 0;
    match_respawn_timer = 0;
    player_respawn_timer = -1;
}

reset_room();

function leave_room() {
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

function end_match() {

}

function process_hit() {
    hits_received[makeid()] = {
        "player_id": other_players_in_room[Math.floor(Math.random() * other_players_in_room.length)],
        "time": Math.floor(new Date().getTime()/1000),
        "shot_location": shot_locations[Math.floor(Math.random() * shot_locations.length)]
    };
    if (player_lives > 0) {
        player_lives = player_lives - 1;
        $("#player_lives").text(player_lives);
    }
    if (player_lives == 0) {
        $("#player_status").html("DEAD");
    }
    if (match_respawn_timer > 0 && player_lives == 0) {
        trigger_player_respawn_timer();
    }
}

function trigger_player_respawn_timer() {
    if (match_respawn_timer > 0 && player_lives == 0) {
        if (player_respawn_timer == -1) {
            //haven't started respawn yet
            player_respawn_timer = match_respawn_timer;
            $("#player_status").html("DEAD <br>"+player_respawn_timer+" seconds");
            setTimeout("trigger_player_respawn_timer()", 1000);
        } else if (player_respawn_timer <= 1) { //1 or 0
            //respawn player
            player_lives = match_lives;
            $("#player_lives").text(player_lives);
            player_respawn_timer = -1;
            $("#player_status").html("Alive<br>&nbsp;");
        } else {
            //respawn ticking down
            player_respawn_timer = player_respawn_timer - 1;
            $("#player_status").html("DEAD <br>"+player_respawn_timer+" seconds");
            setTimeout("trigger_player_respawn_timer()", 1000);
        }
    }
}

function receive_fake_hit() {
    process_hit();
    $("#mainnavbar_button").click();
}

function send_fake_shot() {

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
            url: "http://127.0.0.1:8001/get_match_details",
            dataType: "json",
            type: "POST",
            data: {
                player_id: localStorage.getItem("player_id"),
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

                if (data.data.received_hit_ids) {
                    console.log("data.data.received_hit_ids", data.data.received_hit_ids);
                    for (var i=0; i<data.data.received_hit_ids.length; i++) {
                        delete hits_received[data.data.received_hit_ids[i]];
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

                    if (player_lives == -1) {
                        //beginning of match, set player to default lives
                        player_lives = parseInt(data.data.lives_per_spawn);
                        $("#player_lives").text(player_lives);
                    }

                    $(".match_in_progress_gametype").text(data.data.gametype);
                    $(".match_rules_lives_per_spawn").text(data.data.lives_per_spawn);
                    $(".match_rules_length").text(data.data.match_length + " minutes");

                    match_lives = data.data.lives_per_spawn;

                    match_respawn_timer = data.data.respawn_timer;
                    var respawn_timer_text = data.data.respawn_timer + " seconds";
                    if (data.data.respawn_timer == -1) {
                        respawn_timer_text = "disabled";
                    }
                    $(".match_rules_respawn_timer").text(respawn_timer_text);
                    var scores_htmlz = "";
                    var players_ids = [];
                    for (var i=0; i<data.data.players.length; i++) {
                        players_ids.push(data.data.players[i]['player_id']);
                        if (data.data.players[i]['player_id'] == localStorage.getItem("player_id")) {
                            $("#player_score").text(data.data.players[i]['score']);
                            scores_htmlz += '<tr bgcolor="#add8e6">';
                        }
                        else {
                            scores_htmlz += '<tr>';
                        }
                        scores_htmlz += '<th scope="row">'+(i+1)+'</th><td>'+data.data.players[i]['alias']+'</td><td>'+data.data.players[i]['score']+'</td></tr>';
                    }
                    other_players_in_room = players_ids;
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
                            $(".full_page").addClass('hide-me');
                            $("#match_about_to_start").removeClass('hide-me');
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
        player_id: localStorage.getItem("player_id"),
        room_code: localStorage.getItem("room_code"),
        gametype: jQuery("#match_config_gametype").val(),
        lives_per_spawn: jQuery("#match_config_lives_per_spawn").val(),
        match_countdown: jQuery("#match_config_countdown").val(),
        match_length: jQuery("#match_config_length").val(),
        respawn_timer: -1,
    };
    if ($('#match_config_respawn_enabled').prop('checked')) {
        post_data['respawn_timer'] = jQuery("#match_config_respawn_timer").val();
    }
    if (!parseInt(post_data['lives_per_spawn'])) {
        post_data['lives_per_spawn'] = 1;
    }
    if (!parseInt(post_data['match_countdown'])) {
        post_data['match_countdown'] = 10;
    }
    if (!parseInt(post_data['match_length'])) {
        post_data['match_length'] = 15;
    }
    if (!parseInt(post_data['respawn_timer'])) {
        post_data['respawn_timer'] = 5;
    }
    jQuery.ajax({
        url: "http://127.0.0.1:8001/start_match",
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

function create_room_submit() {
    if (!jQuery("#create_room_room_code").val()) {
        alert("Must enter room code!");
    }
    else {
        $(".full_page").addClass('hide-me');
        jQuery.ajax({
            url: "http://127.0.0.1:8001/create_room",
            dataType: "json",
            type: "POST",
            data: {
                player_id: localStorage.getItem("player_id"),
                room_code: jQuery("#create_room_room_code").val(),
                gametype: jQuery("#create_room_gametype").val(),
                locked_down: jQuery("#create_room_locked_down").val(),
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
                localStorage.setItem("room_code", data.data.room_code);
                $("#waiting_for_match_to_start").removeClass('hide-me');
                if (data.data.creator_player_id == localStorage.getItem("player_id")) {
                    $("#waiting_for_match_to_start_nonadmin").addClass('hide-me');
                    $("#waiting_for_match_to_start_admin").removeClass('hide-me');
                }
                else {
                    $("#waiting_for_match_to_start_nonadmin").removeClass('hide-me');
                    $("#waiting_for_match_to_start_admin").addClass('hide-me');
                }
                poll_match();
            }
        });
    }
}

function join_existing_room_submit() {
    if (!jQuery("#join_room_room_code").val()) {
        alert("Must enter room code!");
    }
    else {
        $(".full_page").addClass('hide-me');
        jQuery.ajax({
            url: "http://127.0.0.1:8001/add_player_to_room", // https://sage-lasertag-api.herokuapp.com
            dataType: "json",
            type: "POST",
            data: {
                player_id: localStorage.getItem("player_id"),
                room_code: jQuery("#join_room_room_code").val(),
            },
            error: function (e) {
                if (e.responseJSON && e.responseJSON.message) {
                    alert(e.responseJSON.message);
                }
                else {
                    console.log("error", e);
                    alert("Error while trying to join existing room");
                }
                $("#create_or_join_room_div").removeClass('hide-me');
            },
            success:function (data) {
                $(".leave_room_action").removeClass('hide-me');
                cleanup_navbar();
                localStorage.setItem("room_code", data.data.room_code);
                $("#waiting_for_match_to_start").removeClass('hide-me');
                if (data.data.creator_player_id == localStorage.getItem("player_id")) {
                    $("#waiting_for_match_to_start_nonadmin").addClass('hide-me');
                    $("#waiting_for_match_to_start_admin").removeClass('hide-me');
                }
                else {
                    $("#waiting_for_match_to_start_nonadmin").removeClass('hide-me');
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
