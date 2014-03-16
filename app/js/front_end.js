var hex_re = /\[(\d+), (\d+)\]/;

var region_hash = {};

var player_colors = {
	1: "#FF5858",
	2: "#B37FFE",
	3: "#B3FF01",
	4: "#FFD300",
	5: "#FF7FFE",
	6: "#009302",
	7: "#FFFF01",
	8: "#B3FFFE"
};

var player_to_colors = {};

var player_regions;

var armies;

var TIMING_EVENTS = {
	ATTACKER_HIGHLIGHT: 1,
	DEFENDER_HIGHLIGHT: 2
};

var get_delay = function(event) {
	if (document.getElementById("animations-toggle").checked) {
		switch (event) {
			case TIMING_EVENTS.ATTACKER_HIGHLIGHT:
				return 0;
			case TIMING_EVENTS.DEFENDER_HIGHLIGHT:
				return 0;
			case TIMING_EVENTS.REINFORCEMENT_SPACER:
				return 0;
			case TIMING_EVENTS.STEP_DELAY:
				return 0;
			case TIMING_EVENTS.REINFORCEMENT_HIGHLIGHT:
				return 0;
			default:
				return 0;
		}
	} else {
		switch (event) {
			case TIMING_EVENTS.ATTACKER_HIGHLIGHT:
				return 375;
			case TIMING_EVENTS.DEFENDER_HIGHLIGHT:
				return 375;
			case TIMING_EVENTS.REINFORCEMENT_SPACER:
				return 150;
			case TIMING_EVENTS.STEP_DELAY:
				return 200;
			case TIMING_EVENTS.REINFORCEMENT_HIGHLIGHT:
				return 200;
			default:
				return 0;
		}
	}
};


var board_context;

var buffer = 10;
var scale_x = 800;
var scale_y = 400;
var height = sample_data["height"];
var width = sample_data["width"];
var unit = scale_x / width / 2;
var cos_30 = Math.cos(30 / 360 * Math.PI * 2);

var draw_region = function(region, selected, reinforcement) {
	var reg_hexes = region_hash[region];
	var edges = [];
	var middle_hex = reg_hexes[0];
	var best_middle = 8;
	for (item in reg_hexes) {
		var oldsize = edges.length;
		get_edges(reg_hexes[item][0], reg_hexes[item][1], region, edges);
		if ((edges.length - oldsize) <= best_middle) { //try and find a hex with no sides drawn
			best_middle = edges.length - oldsize;
			middle_hex = reg_hexes[item];
		}
	}

	build_path(edges);

	var owner = find_region_owner(region);

	board_context.lineWidth = 3;
	if (selected) {
		board_context.strokeStyle = "#ec130e";
		board_context.fillStyle = "#000000";
	} else {
		board_context.strokeStyle = "#222244";
		board_context.fillStyle = player_colors[player_to_colors[owner]];
	}

	board_context.closePath();
	board_context.fill();
	board_context.stroke();

	draw_army_label(region, middle_hex, reinforcement);

};

var draw_army_label = function(region, hex, reinforcement) {
	var point = get_center_of_hex(hex[0], hex[1]);
	var offset = .6 * unit;
	if (reinforcement) {
		board_context.fillStyle = 'black';
	} else {
		board_context.fillStyle = 'white';
	}
	board_context.fillRect(point[0] - offset, point[1] - offset, 14, 12);
	board_context.font = 'Bold 9pt Arial black';
	if (reinforcement) {
		board_context.fillStyle = 'white';
	} else {
		board_context.fillStyle = 'black';

	}
	board_context.textAlign = 'center';
	board_context.fillText(armies[region], point[0], point[1] + 4);

};


var build_path = function(edges) {
	board_context.beginPath();
	var start_point = edges[0][0];
	var current_edge = edges[0];
	var next_point = edges[0][1];
	var run = true;
	board_context.moveTo(start_point[0], start_point[1]);
	while (run) {
		board_context.lineTo(next_point[0], next_point[1]);

		if (same_point(next_point, start_point)) {
			run = false;
		}

		for (var i = edges.length - 1; i >= 0; i--) {
			if (same_edge(edges[i], current_edge)) {
				edges.splice(i, 1);
				break;
			}
		}

		for (var edge_i in edges) {
			var edge = edges[edge_i];
			if (same_point(edge[0], next_point)) {
				next_point = edge[1];
				current_edge = edge;
				break;
			}
			if (same_point(edge[1], next_point)) {
				next_point = edge[0];
				current_edge = edge;
				break;
			}
		}
	}
	board_context.closePath();
};

var find_region_owner = function(reg) {
	for (var player in player_regions) {
		if (player_regions[player].indexOf(parseInt(reg)) > -1)
			return player;
	}
};

var same_point = function(point_a, point_b) {
	return point_a[0] == point_b[0] && point_a[1] == point_b[1];
};

var same_edge = function(edge_a, edge_b) {
	return same_point(edge_a[0], edge_b[0]) && same_point(edge_a[1], edge_b[1]);
};

var get_center_of_hex = function(q, r) {
	var by = unit + unit * r * (1.5) + buffer / 2;
	var bx = r * unit * cos_30 + (q - (height / 2 - 1)) * unit * cos_30 * 2 + buffer / 2;
	return [bx, by];
};

var announce_region = function(x, y) {
	var closest_reg;
	var distance = 9999999;
	for (var value in hexes) {
		var vals = value.match(hex_re);
		var reg = hexes[value];
		var point = get_center_of_hex(parseInt(vals[1]), parseInt(vals[2]));
		if ((point[0] - x) * (point[0] - x) + (point[1] - y) * (point[1] - y) < distance) {
			distance = (point[0] - x) * (point[0] - x) + (point[1] - y) * (point[1] - y);
			closest_reg = reg;
		}
	}
	alert(closest_reg);
}

var get_edges = function(q, r, reg, edge_col) {
	var center_point = get_center_of_hex(q, r);

	var bx = center_point[0];
	var by = center_point[1];
	var points = {
		ne: [Math.round(bx + cos_30 * unit), Math.round(by - .5 * unit)],
		n: [Math.round(bx), Math.round(by - unit)],
		nw: [Math.round(bx - cos_30 * unit), Math.round(by - .5 * unit)],
		sw: [Math.round(bx - cos_30 * unit), Math.round(by + .5 * unit)],
		s: [Math.round(bx), Math.round(by + unit)],
		se: [Math.round(bx + cos_30 * unit), Math.round(by + .5 * unit)]
	};
	var edges = {
		e: [points.ne, points.se],
		ne: [points.ne, points.n],
		nw: [points.n, points.nw],
		w: [points.nw, points.sw],
		sw: [points.sw, points.s],
		se: [points.s, points.se]
	};

	if (!e_neighbor_match(q, r, reg)) {
		edge_col.push(edges.e);
	}

	if (!ne_neighbor_match(q, r, reg)) {
		edge_col.push(edges.ne);
	}

	if (!nw_neighbor_match(q, r, reg)) {
		edge_col.push(edges.nw);
	}

	if (!w_neighbor_match(q, r, reg)) {
		edge_col.push(edges.w);
	}

	if (!sw_neighbor_match(q, r, reg)) {
		edge_col.push(edges.sw);
	}

	if (!se_neighbor_match(q, r, reg)) {
		edge_col.push(edges.se);
	}

};

var ne_neighbor_match = function(q, r, reg) {
	return neighbor_match(q + 1, r - 1, reg);
};

var sw_neighbor_match = function(q, r, reg) {
	return neighbor_match(q - 1, r + 1, reg);
};

var e_neighbor_match = function(q, r, reg) {
	return neighbor_match(q + 1, r, reg);
};

var se_neighbor_match = function(q, r, reg) {
	return neighbor_match(q, r + 1, reg);
};

var w_neighbor_match = function(q, r, reg) {
	return neighbor_match(q - 1, r, reg);
};

var nw_neighbor_match = function(q, r, reg) {
	return neighbor_match(q, r - 1, reg);
};

var neighbor_match = function(q, r, reg) {
	return parseInt(reg) === hexes["[" + q + ", " + r + "]"];
}

var process_hexes = function() {
	region_hash = {};
	for (var value in hexes) {
		var vals = value.match(hex_re);
		var reg = hexes[value];
		if (!region_hash[reg]) {
			region_hash[reg] = [];
		}
		region_hash[reg].push([parseInt(vals[1]), parseInt(vals[2])]);
	}

};

var hexes;

var clear_board = function(game_board, context) {
	context.save();

	// Use the identity matrix while clearing the canvas
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, game_board.width, game_board.height);

	// Restore the transform
	context.restore();


}

var load_game = function() {
	var game_board = document.getElementById("game-display");
	hexes = hexes_local;
	board_context = game_board.getContext("2d");
	clear_board(game_board, board_context);
	process_hexes();
	for (var region in region_hash) {
		draw_region(region, false, false);
	}

};

var load_custom_game = function(data) {
	hexes = data;
	process_hexes();
};


/*[{"player_id":1,"name":"Bob","bulk":2,"reserves":0,"is_my_turn":false},{"player_id":3,"name":"Jones","bulk":27,"reserves":6,"is_my_turn":false},{"player_id":2,"name":"Fred","bulk":null,"reserves":0,"is_my_turn":true}]*/

var process_player_stats = function(data) {
	for (var key in data) {
		var player_info = data[key];
		var id = player_info["player_id"];
		var name = player_info["name"];
		var bulk = player_info["bulk"] || 0;
		var reserves = player_info["reserves"] || 0;
		var turn = player_info["is_my_turn"];
		update_player_status_window(id, name, bulk, reserves, turn);
	}
};

var status_context;

var update_turn_counter = function(turn) {
	var player_board = document.getElementById("player-display");
	if (!status_context)
		status_context = player_board.getContext("2d");
	var yOffset = 340;


	status_context.clearRect(0, yOffset, 130, 30);

	status_context.fillStyle = "black";
	status_context.textBaseline = "top";
	status_context.font = '13pt Arial black';
	status_context.textAlign = 'top';
	status_context.fillText('Step: ' + turn, 0, yOffset);
};

var update_player_status_window = function(id, name, bulk, reserves, turn) {
	var player_board = document.getElementById("player-display");
	status_context = player_board.getContext("2d");
	var box_height = 22;
	var box_width = 22;
	var player_num = player_to_colors[id];
	status_context.textBaseline = "bottom";

	status_context.clearRect(0, box_height * (player_num - 1), 250, box_height);

	status_context.beginPath();
	status_context.rect(1, box_height * (player_num - 1), box_height - 2, box_width - 2);
	status_context.fillStyle = player_colors[player_num];
	status_context.fill();
	if (turn) {
		status_context.fillStyle = "black";
		status_context.lineWidth = 2;
		status_context.stroke();
		status_context.closePath();
	}
	status_context.fillStyle = "black";
	status_context.font = 'Bold 10pt Arial black';
	status_context.textAlign = 'left';
	status_context.fillText(name + ' : ' + bulk + ' : ' + reserves, box_width + 5, box_height * (player_num - 1) + 15);
};

var playing = false;

var play_loop = function() {
	playing = true;
	next_step();
};

var stop = function() {
	playing = false;
};

var next_step = function() {
	if (Object.keys(game_events).length < current_step) {
		if (keep_polling) {
			get_new_events();
		}
		return;
	}
	var the_event = game_events[current_step];
	current_step += 1;

	update_turn_counter(current_step);

	if (the_event["type"] === "reinforcement") {
		process_reinforcement(the_event);
	} else {
		process_attack(the_event);
	}
};

var last_step = function() {
	if (current_step <= 1) {
		return;
	}
	current_step -= 1;
	var the_event = game_events[current_step];
	update_turn_counter(current_step);

	if (the_event["type"] === "reinforcement") {
		reverse_reinforcement(the_event);
	} else {
		reverse_attack(the_event);
	}
}
/*
					"type": "battle"
					"attacking_region": game_event["attacking_region_id"],
					"defending_region": game_event["defending_region_id"],
					"attack_dice": game_event["attack_dice"],
					"defense_dice": game_event["defense_dice"],
					"victory": game_event["attack_successful"],
					"attacker" :game_event["attacker"],
					"defender" :game_event["defender"]



{"game_id":2,"ordinal":3,"event_type":"battle",
	"attacking_region_id":37,
	"defending_region_id":47,
	"attacker":{"player_id":4,"name":"bob","bulk":9,"reserves":0,"total_strength":40,"regions":16,"is_my_turn":true},
	"defender":{"player_id":3,"name":"devui","bulk":12,"reserves":0,"total_strength":44,"regions":14,"is_my_turn":false},
	"attack_strength":6,
	"defense_strength":1,
	"attack_dice":[5,2,4,3,5,1],
	"defense_dice":[3]
	,"attack_value":20,"defense_value":3,"attack_successful":true}
*/
var process_attack = function(attack) {
	var attacker = attack["attacking_region"];
	var defender = attack["defending_region"];
	var attack_dice = attack["attack_dice"];
	var victory = attack["victory"];
	draw_region(attacker, true, false);
	setTimeout(function() {

		draw_region(defender, true, false);

		if (victory) {
			setTimeout(function() {
				process_victory(attacker, defender, attack_dice);
			}, get_delay(TIMING_EVENTS.DEFENDER_HIGHLIGHT));
		} else {
			setTimeout(function() {
				process_loss(attacker, defender);
			}, get_delay(TIMING_EVENTS.DEFENDER_HIGHLIGHT));
		}
	}, get_delay(TIMING_EVENTS.ATTACKER_HIGHLIGHT));

};

/*
					"type": "battle"
					"attacking_region": game_event["attacking_region_id"],
					"defending_region": game_event["defending_region_id"],
					"attack_dice": game_event["attack_dice"],
					"defense_dice": game_event["defense_dice"],
					"victory": game_event["attack_successful"],
					"attacker" :game_event["attacker"],
					"defender" :game_event["defender"]



{"game_id":2,"ordinal":3,"event_type":"battle",
	"attacking_region_id":37,
	"defending_region_id":47,
	"attacker":{"player_id":4,"name":"bob","bulk":9,"reserves":0,"total_strength":40,"regions":16,"is_my_turn":true},
	"defender":{"player_id":3,"name":"devui","bulk":12,"reserves":0,"total_strength":44,"regions":14,"is_my_turn":false},
	"attack_strength":6,
	"defense_strength":1,
	"attack_dice":[5,2,4,3,5,1],
	"defense_dice":[3]
	,"attack_value":20,"defense_value":3,"attack_successful":true}
*/

var reverse_attack = function(attack) {
	var def_reg = attack["defending_region"];
	var att_reg = attack["attacking_region"];
	var defender = attack["defender"];
	var attacker = attack["attacker"];

	armies[att_reg] = attack["attack_dice"].length;
	armies[def_reg] = attack["defense_dice"].length;

	if (attack["victory"]) {
		var temp = player_regions[attacker];
		var index = temp.indexOf(def_reg);
		temp.splice(index, 1);
		player_regions[attacker] = temp;

		player_regions[defender].push(def_reg);
	}

	draw_region(att_reg, false, false);
	draw_region(def_reg, false, false);

};

var process_victory = function(attacker, defender, attack_dice) {
	armies[attacker] = 1;
	armies[defender] = attack_dice.length - 1;
	var loser = find_region_owner(defender);
	var winner = find_region_owner(attacker);

	var temp = player_regions[loser];
	var index = temp.indexOf(defender);
	temp.splice(index, 1);

	player_regions[loser] = temp;
	player_regions[winner].push(defender);

	draw_region(attacker, false, false);
	draw_region(defender, false, false);
	if (playing) {
		setTimeout(function() {
			next_step();
		}, get_delay(TIMING_EVENTS.STEP_DELAY));
	}
};

var process_loss = function(attacker, defender) {
	armies[attacker] = 1;
	draw_region(attacker, false, false);
	draw_region(defender, false, false);
	if (playing) {
		setTimeout(function() {
			next_step();
		}, get_delay(TIMING_EVENTS.STEP_DELAY));
	}
};

var reverse_reinforcement = function(reinfo) {
	var placements = reinfo["placements"];
	for (var reg in placements) {
		armies[reg] = armies[reg] - parseInt(placements[reg]);
		draw_region(reg, false, false);
	}
};

var process_reinforcement = function(reinfo) {
	var history = reinfo["history"];
	if (history[0]) {
		place_reinforcement_helper(history, 0);
	} else if (playing) {
		setTimeout(function() {
			next_step();
		}, get_delay(TIMING_EVENTS.STEP_DELAY));
	}
};

var place_reinforcement_helper = function(history, i) {
	var reg = history[i];
	armies[reg] = armies[reg] + 1;
	draw_region(reg, false, true);
	setTimeout(function() {
		draw_region(reg, false, false);
	}, get_delay(TIMING_EVENTS.REINFORCEMENT_HIGHLIGHT));
	if (history[i + 1]) {
		setTimeout(function() {
			place_reinforcement_helper(history, i + 1);
		}, get_delay(TIMING_EVENTS.REINFORCEMENT_SPACER));
	} else if (playing) {
		setTimeout(function() {
			next_step();
		}, get_delay(TIMING_EVENTS.STEP_DELAY));
	}
}

/*
"game_id":1,"ordinal":1,"event_type":"reinforcement","player_id":1,"pool_initial":20,"pool_final":0,
	"history":[4,13,25,19,4,10,1,25,19,13,1,7,28,7,16,16,10,28,22,22],
	"placements":{"4":2,"13":2,"25":2,"19":2,"10":2,"1":2,"7":2,"28":2,"16":2,"22":2}}

*/
var game_events;
var current_step;
var player_count;
var keep_polling;

var process_game_history = function(data) {
	game_events = {};
	current_step = 1;
	keep_polling = true;
	update_turn_counter(current_step);
	player_count = Object.keys(player_to_colors).length;
	update_local_history(data);

};

var additional_game_history = function(data) {
	update_local_history(data);
	if (playing) {
		next_step();
	}
};

var update_local_history = function(data) {
	for (var key in data) {
		var game_event = data[key];
		var ordinal = game_event["ordinal"];
		var player = game_event["player_id"];

		if (ordinal <= player_count) {
			//initial setup.			
			var placements = game_event["placements"];
			for (var region_id in placements) {
				armies[region_id] = armies[region_id] + placements[region_id];
				draw_region(region_id, false, false);
			}
		} else {
			//log events for usage.
			if (game_event["event_type"] === "reinforcement") {
				game_events[ordinal - player_count] = {
					"type": "reinforcement",
					"player": player,
					"pool_initial": game_event["pool_initial"],
					"history": game_event["history"],
					"placements": game_event["placements"]
				};
			} else {
				game_events[ordinal - player_count] = {
					"type": "battle",
					"attacking_region": game_event["attacking_region_id"],
					"defending_region": game_event["defending_region_id"],
					"attack_dice": game_event["attack_dice"],
					"defense_dice": game_event["defense_dice"],
					"victory": game_event["attack_successful"],
					"attacker": game_event["attacker_id"],
					"defender": game_event["defender_id"]
				};
			}

		}
	}
}

/*
{"game_id":2,"ordinal":3,"event_type":"battle",
	"attacking_region_id":37,
	"defending_region_id":47,
	"attacker":{"player_id":4,"name":"bob","bulk":9,"reserves":0,"total_strength":40,"regions":16,"is_my_turn":true},
	"defender":{"player_id":3,"name":"devui","bulk":12,"reserves":0,"total_strength":44,"regions":14,"is_my_turn":false},
	"attack_strength":6,
	"defense_strength":1,
	"attack_dice":[5,2,4,3,5,1],
	"defense_dice":[3]
	,"attack_value":20,"defense_value":3,"attack_successful":true}
	

*/


var process_player_data = function(data) {
	armies = {};
	player_regions = {};
	player_to_colors = {};


	for (var item in data) {
		var region_info = data[item];
		var region_id = region_info["region_id"];
		var army = region_info["strength"];
		var player = region_info["owner_id"];
		armies[region_id] = army;
		if (!player_regions[player]) {
			player_regions[player] = [];
		}
		player_regions[player].push(region_id);

		if (!player_to_colors[player]) {
			player_to_colors[player] = Object.keys(player_to_colors).length + 1;
		}
	}

	for (var region in region_hash) {
		draw_region(region, false, false);
	}
};

/*
{"game_id":16,"name":"Game 16",
"state":"complete","active_players":1,"number_of_players":5,"action_count":379,"winner":{"id":36,"reserves":0,"seat_number":3,"has_lost":false,"user_id":12,"game_id":16},"players":[{"player_id":36,"name":"Genetic4","bulk":30,"reserves":0,"total_strength":170,"regions":30,"is_my_turn":true}],"regions":[{"region_id":451,"owner_id":36,"strength":8},{"region_id":452,"owner_id":36,"strength":6},{"region_id":453,"owner_id":36,"strength":8},{"region_id":454,"owner_id":36,"strength":1},{"region_id":455,"owner_id":36,"strength":8},{"region_id":456,"owner_id":36,"strength":1},{"region_id":457,"owner_id":36,"strength":8},{"region_id":458,"owner_id":36,"strength":1},{"region_id":459,"owner_id":36,"strength":8},{"region_id":460,"owner_id":36,"strength":2},{"region_id":461,"owner_id":36,"strength":8},{"region_id":462,"owner_id":36,"strength":7},{"region_id":463,"owner_id":36,"strength":8},{"region_id":464,"owner_id":36,"strength":4},{"region_id":465,"owner_id":36,"strength":5},{"region_id":466,"owner_id":36,"strength":4},{"region_id":467,"owner_id":36,"strength":1},{"region_id":468,"owner_id":36,"strength":8},{"region_id":469,"owner_id":36,"strength":8},{"region_id":470,"owner_id":36,"strength":8},{"region_id":471,"owner_id":36,"strength":8},{"region_id":472,"owner_id":36,"strength":8},{"region_id":473,"owner_id":36,"strength":6},{"region_id":474,"owner_id":36,"strength":5},{"region_id":475,"owner_id":36,"strength":6},{"region_id":476,"owner_id":36,"strength":1},{"region_id":477,"owner_id":36,"strength":7},{"region_id":478,"owner_id":36,"strength":8},{"region_id":479,"owner_id":36,"strength":8},{"region_id":480,"owner_id":36,"strength":1}]}*/

var process_game_summary = function(data){
	if(data["state"] === "complete"){
		keep_polling = false;
	}
};

var board_left;
var board_top;

var load_remote_game = function() {
	var game_board = document.getElementById("game-display");
	board_context = game_board.getContext("2d");
	clear_board(game_board, board_context);


	board_left = game_board.offsetLeft,
	board_top = game_board.offsetTop,

	// Add event listener for `click` events.
	game_board.removeEventListener('click', region_click_handler);
	game_board.addEventListener('click', region_click_handler);

	var gameId = document.getElementById("game_id_input").value;
	start_remote_load(gameId || 2);
};

var region_click_handler = function(event) {
	var x = event.pageX - board_left,
		y = event.pageY - board_top;
	announce_region(x, y);
};


var game_id;

var start_remote_load = function(id) {

	game_id = id;

	var url = "http://192.168.0.123:3000/geography";

	$.ajax({
		type: 'GET',
		url: url,
		data: {
			game_id: id
		},
		contentType: 'text/plain',

		xhrFields: {
			withCredentials: false
		},

		headers: {

		},

		success: function(data) {
			load_custom_game(data);
			load_player_data(id);
		},

		error: function() {}
	});
};

var load_player_stats = function(id) {
	var url = "http://192.168.0.123:3000/players";

	$.ajax({
		type: 'GET',
		url: url,
		data: {
			game_id: id
		},
		contentType: 'text/plain',

		xhrFields: {
			withCredentials: false
		},

		headers: {

		},

		success: function(data) {
			process_player_stats(data);
		},

		error: function() {}
	});
};

var load_event_history = function(id) {
	var url = "http://192.168.0.123:3000/events";

	$.ajax({
		type: 'GET',
		url: url,
		data: {
			game_id: id,
			since: 0
		},
		contentType: 'text/plain',

		xhrFields: {
			withCredentials: false
		},

		headers: {

		},

		success: function(data) {
			process_game_history(data);
		},

		error: function() {}
	});
};

var load_player_data = function(id) {

	var url = "http://192.168.0.123:3000/start_state";

	$.ajax({
		type: 'GET',
		url: url,
		data: {
			game_id: id
		},
		contentType: 'text/plain',

		xhrFields: {
			withCredentials: false
		},

		headers: {

		},

		success: function(data) {
			process_player_data(data);
			load_player_stats(id);
			load_event_history(id);
		},

		error: function() {}
	});

};

var get_new_events = function() {

	var url = "http://192.168.0.123:3000/events";

	$.ajax({
		type: 'GET',
		url: url,
		data: {
			game_id: game_id,
			since: current_step + player_count - 1
		},
		contentType: 'text/plain',

		xhrFields: {
			withCredentials: false
		},

		headers: {

		},

		success: function(data) {
			additional_game_history(data);
			check_for_finished();
		},

		error: function() {}
	});
};

var check_for_finished = function() {

	var url = "http://192.168.0.123:3000/game";

	$.ajax({
		type: 'GET',
		url: url,
		data: {
			game_id: game_id
		},
		contentType: 'text/plain',

		xhrFields: {
			withCredentials: false
		},

		headers: {

		},

		success: function(data) {
			process_game_summary(data);			
		},

		error: function() {}
	});
};