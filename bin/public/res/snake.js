var can = document.getElementById("myCan");
context = can.getContext("2d");
var pos_x = 0;
var pos_y = 200;
var val = 0;
var pre_x = 0;
var pre_y = 0;
var saas_x = [];
var saas_y = [];
var pos_apple = [];
var soos = 0;
var score = 1; 
var e = 0;
var d = 0;
var c = 0;
var i = 0;
var f = 0;
var u = 0;
var q = 1;
var zahl = 40;
var leel = 0;
var inBody = false; 
var keyValue=0;

window.addEventListener("keypress", checkKeyPress, true);
 function checkKeyPress(key){
	keyValue=key.keyCode;
}

setInterval(game, 120);
 
function game(){
	if(pos_x<1000&&pos_x>=0&&pos_y<520&&pos_y>=0){
		if(keyValue == "97"&&(val != 3 || score == 1)){ 
			val = 4;}
		else if(keyValue == "100"&&(val != 4 || score == 1)){
			val = 3;}
		else if(keyValue == "115"&&(val != 1 || score == 1)){
			val = 2;}
		else if(keyValue == "119"&&(val != 2 || score == 1)){
			val = 1;}
	}
	if(soos == 0){
		do{
			inBody = false; 
			pos_apple[1] = Math.floor(Math.random() * 1000/zahl)*zahl;
			pos_apple[2] = Math.floor(Math.random() * 400/zahl)*zahl;
			for(i = 0; i < score; i ++){
				if(pos_apple[1] == saas_x[f-i] && pos_apple[2] == saas_y[f-i]){
					inBody=true;
				}
			}	
		}while(inBody==true);
		context.fillStyle = "#66ff33";
		context.fillRect(pos_apple[1],pos_apple[2],zahl,zahl);
		soos = 1;	
	}			
	
 d = 0;
 f = saas_x.length; 
 c = saas_x.length-score;
 context.clearRect(saas_x[c],saas_y[c],zahl,zahl);

 if(val == 3){pos_x = pos_x+zahl;}
 else if(val == 4){pos_x = pos_x-zahl;}
 else if(val == 2){pos_y = pos_y+zahl;}
 else if(val == 1){pos_y = pos_y-zahl;}
 if(pos_x<0){
	pos_x=1000;
 }
 if(pos_x>1000){
	pos_x=-40;
 }
 if(pos_y<0){
	pos_y=520;
 }
 if(pos_y>520){
	pos_y=0;
 }
 saas_x.push(pos_x);
 saas_y.push(pos_y);
 context.fillStyle = "orange";
 context.fillRect(pos_x,pos_y,zahl,zahl);
  
 if(pos_x == pos_apple[1] && pos_y == pos_apple[2]){
    score = score+1; soos = 0;}

 for(i = 1; i < score; i ++){
     if(pos_x == saas_x[f-i] && pos_y == saas_y[f-i] && d == 0){
       alert("Game Over!");d = 1;score = 1;pos_x = 400; pos_y = 200;val = 0;context.clearRect(0,0,1000,520);soos = 0;}}
}