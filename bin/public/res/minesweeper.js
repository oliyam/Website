var can = document.getElementById("myCan");
context = can.getContext("2d");

var sizex=500;
var sizey=500;

var blocked=false;

var covered=new Array(10);
for(var i=0;i<10;i++)
	covered[i]=new Array(10);

var bomb=new Array(10);
for(var i=0;i<10;i++)
	bomb[i]=new Array(10);

var numbers=new Array(10);
for(var i=0;i<10;i++)
	numbers[i]=new Array(10);

var flagged=new Array(10);
for(var i=0;i<10;i++)
	flagged[i]=new Array(10);

var alreadyChecked=new Array(10);
for(var i=0;i<10;i++)
	alreadyChecked[i]=new Array(10);

var notRight=new Array(10);
for(var i=0;i<10;i++)
	notRight[i]=new Array(10);

var key=0;

function newGame(){
	for(var i=0;i<10;i++)
		for(var o=0;o<10;o++)
			flagged[i][o]=false;
	for(var i=0;i<10;i++)
		for(var o=0;o<10;o++)
			alreadyChecked[i][o]=false;	
	for(var i=0;i<10;i++)
		for(var o=0;o<10;o++)
			notRight[i][o]=false;		
	initBombs(document.getElementById("bomb-select").value); 
	initNumbers(); 
	coverAll();
	blocked=false;
	game();	
}	

newGame();

can.addEventListener("click", checkClick, true);
window.addEventListener("keydown", checkKey, true);
function checkKey(e){
	key=e.keyCode;
}
window.addEventListener("keyup", checkKeyUp, true);
function checkKeyUp(e){
	key=0;
}
function checkClick(e){
	if(!blocked){
		var o=Math.floor(e.offsetY/(sizey/10));
		var i=Math.floor(e.offsetX/(sizex/10));
		console.log(i+" "+o);	
		if(key==70){
			if(covered[i][o])
				flagged[i][o]=!flagged[i][o];
		}	
		else if(!flagged[i][o]){
			if(covered[i][o])
				uncover(i,o);
			else if(!covered[i][o]&&allFlagsSet(i,o))
				uncoverSurrounding(i,o);	
		}
		
		game();	
		checkGameOver();
	}
}

function uncoverSurrounding(i,o){
	for(var t=-1;t<2;t++)
		for(var q=-1;q<2;q++)
			if(i+t>=0&&i+t<10&&o+q>=0&&o+q<10){
				if(!flagged[i+t][o+q]){
					if(numbers[i+t][o+q]==0)
						uncover(i+t,o+q);
					covered[i+t][o+q]=false;
				}	
				else if(!bomb[i+t][o+q]){
					flagged[i+t][o+q]=false;
					notRight[i+t][o+q]=true;
				}
			}
}

function allFlagsSet(i,o){
	var flags=0;
	for(var t=-1;t<2;t++)
		for(var q=-1;q<2;q++)
			if(i+t>=0&&i+t<10&&o+q>=0&&o+q<10)
				if(flagged[i+t][o+q])
					flags++;
	return flags==numbers[i][o];			
}

function checkWin(){
	var complete=true;
	for(var i=0;i<10;i++)
		for(var o=0;o<10;o++)
			if(flagged[i][o]!=bomb[i][o]||(covered[i][o]&&!bomb[i][o]))
				complete=false;
	if(complete){
		blocked=true;
		alert("Yay you made it!");	
	}
}	

function uncover(i,o){
	alreadyChecked[i][o]=true;
	if(!flagged[i][o])
		covered[i][o]=false;
	for(var t=-1;t<2;t++){
		for(var q=-1;q<2;q++){
			if(i+t>=0&&i+t<10&&o+q>=0&&o+q<10){
				if(numbers[i][o]==0)
					if(!flagged[i+t][o+q])
						covered[i+t][o+q]=false;
				if(numbers[i+t][o+q]==0&&!alreadyChecked[i+t][o+q]){
					uncover(i+t,o+q);	
				}	
			}	
		}		
	}	
}
 
function coverAll(){
	for(var i=0;i<10;i++)
		for(var o=0;o<10;o++)
			covered[i][o]=true;
} 
 
function initBombs(bombNumber){
	for(var i=0;i<10;i++)
		for(var o=0;o<10;o++)
			bomb[i][o]=false;
	for(var i=0;i<bombNumber;i++){
		do{
		var bombSpot=(Math.floor(Math.random()*(10*10)));
		}while(bomb[bombSpot%10][Math.floor(bombSpot/10)]==true);
		bomb[bombSpot%10][Math.floor(bombSpot/10)]=true;
	}			
} 

function initNumbers(){
	for(var i=0;i<10;i++)
		for(var o=0;o<10;o++){
				var bombsInRadius=0;
				for(var t=-1;t<2;t++){
					for(var q=-1;q<2;q++){
						if([i+t]>=0&&[i+t]<10&&[o+q]>=0&&[o+q]<10){
							if(bomb[i+t][o+q]){
								bombsInRadius++;	
							}	
						}	
					}		
				}	
				numbers[i][o]=bombsInRadius;	
		}	
}

function checkGameOver(){
	for(var i=0;i<10;i++)
		for(var o=0;o<10;o++)	
			if(bomb[i][o]&&!covered[i][o]){
				blocked=true;
			}
}

function game(){
	context.clearRect(0,0,sizex,sizey); 
	for(var i=0;i<10;i++)
		for(var o=0;o<10;o++){
			if(covered[i][o]){
				context.fillStyle = "grey";
				context.fillRect(i*sizex/10,o*sizey/10,sizex/10,sizey/10); 		
			}
			else if(bomb[i][o]){
				context.fillStyle = "red";
				context.fillRect(i*sizex/10,o*sizey/10,sizex/10,sizey/10);
			}
			else if(numbers[i][o]!=0){
				context.font = sizex/10+"px Arial";
				context.fillStyle = "rgba(255,"+(numbers[i][o]*50)+",165,1)";
				context.fillText(numbers[i][o],i*sizex/10+10,o*sizey/10+sizey/10-5);
			}	
			if(flagged[i][o]){
				context.fillStyle = "green";
				context.fillRect(i*sizex/10+10,o*sizey/10+10,sizex/10-20,sizey/10-20); 			
			}
			if(notRight[i][o]){
				context.fillStyle = "red";
				context.fillRect(i*sizex/10,o*sizey/10,sizex/10,sizey/10);
				context.fillStyle = "black";
				context.fillText("X",i*sizex/10+9,o*sizey/10+sizey/10-7);
			}
    }
	for(var i=0;i<10;i++){
	  context.fillStyle = "black";  
	  context.beginPath();
      context.moveTo(i*sizey/10,0);
      context.lineTo(i*sizey/10,sizex);
	  context.moveTo(0,i*sizex/10);
      context.lineTo(sizey,i*sizex/10);
	  context.stroke();
	}  
}
