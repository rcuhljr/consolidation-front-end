
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
var player_selected_colors = {
	1: "#FF6868",
	2: "#C38FFE",
	3: "#C3FF11",
	4: "#FFF310",
	5: "#FF8FFE",
	6: "#10A312",
	7: "#FFFF11",
	8: "#A3FFFE"
};

var player_regions = {
	1: [31, 32, 33, 34],
	2: [35, 36, 37, 38],
	3: [39, 40, 41, 42],
	4: [43, 44, 45, 46],
	5: [47, 48, 49, 50],
	6: [51, 52, 53, 54],
	7: [55, 56, 57],
	8: [58, 59, 60]
};

var game_board = document.getElementById("game-display");
var board_context = game_board.getContext("2d");

var buffer = 10;
var scale_x = 800;
var scale_y = 400;
var height = sample_data["height"];
var width = sample_data["width"];
var unit = scale_x / width / 2;
var cos_30 = Math.cos(30 / 360 * Math.PI * 2);

var draw_region = function(region, reg_hexes, selected) {

	var edges = [];

	for (item in reg_hexes) {
		get_edges(reg_hexes[item][0], reg_hexes[item][1], region, edges);
	}

	build_path(edges);
	//board_context.stroke();

	var owner = find_region_owner(region);

	board_context.lineWidth = 3;
	if (selected) {
		board_context.strokeStyle = "#ec130e";
		board_context.fillStyle = "#000000";
	} else {
		board_context.strokeStyle = "#222244";
		board_context.fillStyle = player_colors[owner];
	}

	board_context.closePath();
	board_context.fill();
	board_context.stroke();

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

var get_edges = function(q, r, reg, edge_col) {

	var by = unit + unit * r * (1.5) + buffer / 2;
	var bx = r * unit * cos_30 + (q - (height / 2 - 1)) * unit * cos_30 * 2 + buffer / 2;
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

var draw_hex = function(q, r, reg) {

	bc = board_context;
	by = unit + unit * r * (1.5);
	bx = r * unit * cos_30 + (q - (height / 2 - 1)) * unit * cos_30 * 2;
	points = {
		ne: [Math.round(bx + cos_30 * unit), Math.round(by - .5 * unit)],
		n: [Math.round(bx), Math.round(by - unit)],
		nw: [Math.round(bx - cos_30 * unit), Math.round(by - .5 * unit)],
		sw: [Math.round(bx - cos_30 * unit), Math.round(by + .5 * unit)],
		s: [Math.round(bx), Math.round(by + unit)],
		se: [Math.round(bx + cos_30 * unit), Math.round(by + .5 * unit)]
	};
	edges = {
		e: [points.ne, points.se],
		ne: [points.ne, points.n],
		nw: [points.n, points.nw],
		w: [points.nw, points.sw],
		sw: [points.sw, points.s],
		se: [points.s, points.se]
	};

	if (!e_neighbor_match(q, r, reg)) {
		bc.moveTo(edges.e[0][0], edges.e[0][1]);
		bc.lineTo(edges.e[1][0], edges.e[1][1]);
	}

	if (!ne_neighbor_match(q, r, reg)) {
		bc.moveTo(edges.ne[0][0], edges.ne[0][1]);
		bc.lineTo(edges.ne[1][0], edges.ne[1][1]);
	}

	if (!nw_neighbor_match(q, r, reg)) {
		bc.moveTo(edges.nw[0][0], edges.nw[0][1]);
		bc.lineTo(edges.nw[1][0], edges.nw[1][1]);
	}

	if (!w_neighbor_match(q, r, reg)) {
		bc.moveTo(edges.w[0][0], edges.w[0][1]);
		bc.lineTo(edges.w[1][0], edges.w[1][1]);
	}

	if (!sw_neighbor_match(q, r, reg)) {
		bc.moveTo(edges.sw[0][0], edges.sw[0][1]);
		bc.lineTo(edges.sw[1][0], edges.sw[1][1]);
	}

	if (!se_neighbor_match(q, r, reg)) {
		bc.moveTo(edges.se[0][0], edges.se[0][1]);
		bc.lineTo(edges.se[1][0], edges.se[1][1]);
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

for (var value in hexes) {
	var vals = value.match(hex_re);
	var reg = hexes[value];
	if (!region_hash[reg]) {
		region_hash[reg] = [];
	}
	region_hash[reg].push([parseInt(vals[1]), parseInt(vals[2])]);
}

for (var region in region_hash) {
	draw_region(region, region_hash[region], false);
}

//draw_region(1, region_hash[1]);

//board_context.stroke();
//draw_hex(10,0);