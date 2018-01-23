function Cell(value) {
  this.value = value;
  this.next_value = null;

  this.x = null;
  this.y = null;
  this.neighborhood = null;
  this.fitness = null;


  this.clicked = function() {
    this.value += 1;
    this.value = this.value % 3;

    console.log(this);
  }

  this.update = function() {
    this.value = this.next_value;
    this.next_value = null;
  }
}

var sample_weighted = function(to_sample, weights) {
  //Check if weights and sample arrays are the same size
  var total_weight = _.sum(weights);
  var cum_weight = 0;
  var target_weight = Math.random() * total_weight;

  for (i = 0; i < to_sample.length; i++) {
    cum_weight += weights[i];
    if (cum_weight >= target_weight)
      return(to_sample[i]);
  }

  return null;
};

function Grid(cols,rows, canvas_width, canvas_height) {
  this.cols = cols;
  this.rows = rows;    
  this.cells = [];

  this.canvas_width = canvas_width;
  this.canvas_height = canvas_height;

  this.cellWidth = canvas_width / this.cols;
  this.cellHeight = canvas_height / this.rows; 
  for(var y = 0; y < rows; y++) {
    this.cells[y] = [];
    for(var x = 0; x < cols; x++) {
      var cell = new Cell();
      cell.x = x;
      cell.y = y;
      cell.value = 0;

      this.cells[y][x] = cell;
    }
  }
}

Grid.prototype.at_pt = function(x_pt, y_pt) {
  if (x_pt < this.canvas_width && y_pt < this.canvas_height && x_pt > 0 && y_pt > 0) {
    //Good click!
    var x_ind = Math.floor(x_pt/this.cellWidth);
    var y_ind = Math.floor(y_pt/this.cellHeight);

    return this.at(x_ind, y_ind);
  }
  return null;
}

Grid.prototype.at = function(x,y) {
  if(x < 0) {
    x = this.cols + x;
  } else if (x >= this.cols) {
    x = x % this.cols;
  }
  if(y < 0 ) {
    y = this.rows + y;
  } else if ( y >= this.rows) {
    y = y % this.rows;
  }
  return this.cells[y][x];
}

Grid.prototype.get_neighbors = function(x, y, local=true) {
  if (local)
    return this.neighborhood(x,y);
  return _.flatten(this.cells);
}
Grid.prototype.neighborhood = function(x,y) {
  cell = this.at(x,y);
  if (cell && cell.neighborhood)
    return cell.neighborhood

  var neighbors = [];
  neighbors.push(this.at(x-1, y-1));
  neighbors.push(this.at(x, y-1));
  neighbors.push(this.at(x+1, y-1));
  neighbors.push(this.at(x-1, y));

  //We can include the focal cell in the neighborhood, or not.
  neighbors.push(cell);
  neighbors.push(this.at(x+1, y));
  neighbors.push(this.at(x-1, y+1));
  neighbors.push(this.at(x, y+1));
  neighbors.push(this.at(x+1, y+1));

  cell.neighborhood = neighbors;

  return neighbors;
}

Grid.prototype.forEach = function(cb, ctx) {
  for(var y = 0; y < this.rows; y++) {
    for(var x = 0; x < this.cols; x++) {
      cb.call(ctx, this.cells[y][x], x, y);
    }
  }
}

Grid.prototype.draw = function() {
  var colors = ['blue', 'red', 'yellow']
  var x = 0,
      y = 0;
  this.forEach(function(cell, x, y) {
    push();
      translate(this.cellWidth * x, this.cellHeight * y);
      strokeWeight(0.1);

      fill(colors[cell.value]);
      rect(0,0,this.cellWidth, this.cellHeight);
    pop();
  }, this);
}

Grid.prototype.calculate_fitness = function() {
  avg_fitness = 0;
  this.forEach(function(cell, x, y) {
    var fitness_sum = 0;
    var neighbors = this.get_neighbors(x, y);

    for (i=0;i<neighbors.length;i++) {
      fitness_sum += fitness_matrix[cell.value][neighbors[i].value] / neighbors.length;
    }
    cell.fitness = fitness_sum;
    avg_fitness += fitness_sum/(grid.cols*grid.rows);
  }, this);
  return avg_fitness;
}

Grid.prototype.reproduce = function(deterministic = true, local = true) {
  //calculate fitness
  avg_fitness = this.calculate_fitness()
  
  //pick the best in neighborhood for each cell, mark new type
  this.forEach(function(cell, x, y) {
    var neighbors = this.get_neighbors(x,y,local)
    
    var winner =null;

    if (deterministic == true)
      winner = _.maxBy(neighbors, function(cell) { return cell.fitness; });
    else  
      winner = sample_weighted(neighbors, _.map(neighbors, 'fitness'))
  
    cell.next_value = winner.value;

  }, this);

  //now do the update
  this.forEach(function(cell) {
    cell.update();
  });

}

var grid;
var WIDTH = 500;
var HEIGHT = 500;
var gui;
var paused = true;
var local = true;
var A = 1.0;
var B = 0;
var C = 1.85;
var D = 0;

var deterministic = true;

var fitness_matrix;

function setup() {
  createCanvas(WIDTH+1, HEIGHT+1);
grid = new Grid(60, 60, WIDTH, HEIGHT);

  

  noiseDetail(256);
  grid.forEach(function(cell,x,y) {
    //console.log(x,y);
    cell.value = Math.floor(Math.random()*3);// >= 0.5 ? 1 : 0;
  });

  var gui = createGui('Controlls');
  sliderRange(0, 4, 0.1)
  gui.addGlobals('deterministic', 'local');
  gui.addButton('Randomize', function(){
    grid.forEach(function(cell,x,y) {
      //console.log(x,y);
      cell.value = Math.floor(Math.random()*3);// >= 0.5 ? 1 : 0;
    });
  });
  gui.addButton('Pause/Play', function() {paused = !paused; });

}

function mousePressed() {
  var clicked_cell = grid.at_pt(mouseX, mouseY);

  if (clicked_cell){
    clicked_cell.clicked();
  }
}

function draw() {
  //PRS
  fitness_matrix = [[1, 2, 0.001],
                    [0.01, 1, 2],
                    [2, 0.01, 1]]
  
  grid.draw();
  if (!paused) 
    grid.reproduce(deterministic, local);
}
