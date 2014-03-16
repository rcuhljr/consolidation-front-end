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


var board_context;

var buffer = 10;
var scale_x = 800;
var scale_y = 400;
var height = sample_data["height"];
var width = sample_data["width"];
var unit = scale_x / width / 2;
var cos_30 = Math.cos(30 / 360 * Math.PI * 2);

var draw_region = function(region, selected) {
	var reg_hexes = region_hash[region];
	var edges = [];
	var middle_hex = reg_hexes[0];

	for (item in reg_hexes) {
		var oldsize = edges.length;
		get_edges(reg_hexes[item][0], reg_hexes[item][1], region, edges);
		if (oldsize == edges.length) //try and find a hex with no sides drawn
			middle_hex = reg_hexes[item];
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

	draw_army_label(region, middle_hex);

};

var draw_army_label = function(region, hex) {
	var point = get_center_of_hex(hex[0], hex[1]);
	var offset = .6 * unit;
	board_context.fillStyle = 'white';
	board_context.fillRect(point[0] - offset, point[1] - offset, 14, 12);
	board_context.font = 'Bold 9pt Arial black';
	board_context.fillStyle = 'black';
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
		draw_region(region, false);
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
		var bulk = player_info["bulk"];
		var reserves = player_info["reserves"];
		var turn = player_info["is_my_turn"];
		update_player_status_window(id, name, bulk, reserves, turn);
	}
};

var update_player_status_window = function(id, name, bulk, reserves, turn) {
	var player_board = document.getElementById("player-display");
	status_context = player_board.getContext("2d");
	var box_height = 22;
	var box_width = 22;
	var player_num = player_to_colors[id];

	status_context.beginPath();
	status_context.rect(1, box_height * (player_num - 1), box_height - 2, box_width - 2);
	status_context.fillStyle = player_colors[player_num];
	status_context.fill();
	if (turn) {
		status_context.fillStyle = "black";
		status_context.lineWidth = 2;
		status_context.stroke();
	}
	status_context.fillStyle = "black";
	status_context.font = 'Bold 10pt Arial black';
	status_context.textAlign = 'left';
	status_context.fillText(name + ' : ' + bulk + ' : ' + reserves, box_width + 11, box_height * (player_num - 1) + 15);
};

var next_step = function() {
	var the_event = game_events[current_step];
	current_step += 1;
	if (the_event["type"] === "reinforcement") {
		process_reinforcement(the_event);
	} else {
		process_attack(the_event);
	}
};
/*
					"type": "battle",
					"player": player,
					"attacker": game_event["attacking_region"],
					"defender": game_event["defending_region"],
					"attack_dice": game_event["attack_dice"],
					"defense_dice": game_event["defense_dice"],
					"victory": game_event["attack_successful"]
*/
var process_attack = function(attack) {
	var attacker = attack["attacker"]["id"];
	var defender = attack["defender"]["id"];
	var attack_dice = attack["attack_dice"];
	var victory = attack["victory"];
	draw_region(attacker,true);
	draw_region(defender,true);

	if(victory){
		setTimeout(function() {
			process_victory(attacker,defender,attack_dice);
		}, 1000);
	}else{
		setTimeout(function() {
			process_loss(attacker,defender);
		}, 1000);
	}
};

var process_victory = function(attacker, defender, attack_dice){
	armies[attacker] = 1;
	armies[defender] = attack_dice.length - 1;
	var loser = find_region_owner(defender);
	var winner = find_region_owner(attacker);
	
	var temp = player_regions[loser];
	var index = temp.indexOf(defender);
	temp.splice(index,1);
	
	player_regions[loser] = temp;
	player_regions[winner].push(defender);

	draw_region(attacker,false);
	draw_region(defender,false);
};

var process_loss = function(attacker, defender){
	armies[defender] = 1;
	draw_region(attacker,false);
	draw_region(defender,false);
};

var process_reinforcement = function(reinfo) {
	var history = reinfo["history"];
	place_reinforcement_helper(history);
};

var place_reinforcement_helper = function(history) {
	var reg = history[0];
	history.splice(0, 1);
	armies[reg] = armies[reg] + 1;
	draw_region(reg, false);
	if (history[0]) {
		setTimeout(function() {
			place_reinforcement_helper(history);
		}, 250);
	}
}

/*
"game_id":1,"ordinal":1,"event_type":"reinforcement","player_id":1,"pool_initial":20,"pool_final":0,
	"history":[4,13,25,19,4,10,1,25,19,13,1,7,28,7,16,16,10,28,22,22],
	"placements":{"4":2,"13":2,"25":2,"19":2,"10":2,"1":2,"7":2,"28":2,"16":2,"22":2}}

	{"game_id":1,"ordinal":7,"event_type":"battle","attacking_region":
		{"id":9,"strength":3,"owner_id":3,"original_owner_id":3,"game_id":1},
	"defending_region":
		{"id":20,"strength":3,"owner_id":3,"original_owner_id":2,"game_id":1},
	"attacker":
		{"id":3,"reserves":6,"user_id":5,"game_id":1},
	"defender":
		{"id":2,"reserves":0,"user_id":4,"game_id":1},
	"attack_strength":3,"defense_strength":1,"attack_dice":[2,6,5],"defense_dice":[1],"attack_value":13,"defense_value":1,"attack_successful":true}
*/
var game_events;
var current_step;

var process_game_history = function(data) {
	game_events = {};
	current_step = 1;
	var player_count = Object.keys(player_to_colors).length;
	for (var key in data) {
		var game_event = data[key];
		var ordinal = game_event["ordinal"];
		var player = game_event["player_id"];

		if (ordinal <= player_count) {
			//initial setup.			
			var placements = game_event["placements"];
			for (var region_id in placements) {
				armies[region_id] = armies[region_id] + placements[region_id];
				draw_region(region_id, false);
			}
		} else {
			//log events for usage.
			if (game_event["event_type"] === "reinforcement") {
				game_events[ordinal - player_count] = {
					"type": "reinforcement",
					"player": player,
					"pool_initial": game_event["pool_initial"],
					"history": game_event["history"]
				};
			} else {
				game_events[ordinal - player_count] = {
					"type": "battle",
					"player": player,
					"attacker": game_event["attacking_region"],
					"defender": game_event["defending_region"],
					"attack_dice": game_event["attack_dice"],
					"defense_dice": game_event["defense_dice"],
					"victory": game_event["attack_successful"]
				};
			}

		}
	}
};


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
		draw_region(region, false);
	}
};

var load_remote_game = function() {
	var game_board = document.getElementById("game-display");
	board_context = game_board.getContext("2d");
	clear_board(game_board, board_context);

	start_remote_load(2);
};

var start_remote_load = function(id) {

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