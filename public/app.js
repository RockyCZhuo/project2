let circleURL = "url('./files/circle.png'),auto";
let crossURL = "url('./files/cross.png'),auto";
//open and connect socket
let socket = io();
let r, g, b;
let w = 600;
let h = 600;
let slots = [0, 0, 0, 0, 0, 0, 0, 0, 0];
const pawnXLoc = [
  w / 6,
  w / 2,
  (5 * w) / 6,
  w / 6,
  w / 2,
  (5 * w) / 6,
  w / 6,
  w / 2,
  (5 * w) / 6,
];
const pawnYLoc = [
  h / 6,
  h / 6,
  h / 6,
  h / 2,
  h / 2,
  h / 2,
  (5 * h) / 6,
  (5 * h) / 6,
  (5 * h) / 6,
];
let isCircle = true;
let hasWinnerLine = false;
let currentTime;
let localPlayerType;
let clientMouseInfo;
let currentSlot=0;
let circleTeam = [];
let crossTeam = [];
let crossImg,circleImg;
let isLocking = false;
let crossWinCount = 0;
let circleWinCount = 0;
let tieCount = 0;

socket.on("connect", () => {
  console.log("Connected");
})


function setup() {
  var canvas = createCanvas(w, h);
  canvas.parent('canvasDiv');
  imageMode(CENTER);
  drawBoard();
  drawPawn();
  crossImg = loadImage('./files/cross.png');
  circleImg = loadImage('./files/circle.png');
  //background("#ff");
  r = random(0, 255);
  g = random(0, 255);
  b = random(0, 255);

  clientMouseInfo = {
    x: mouseX,
    y: mouseY,
    colorR: r,
    colorG: g,
    colorB: b,
    id: socket.id,
    type: localPlayerType,
    slot: -1
  }
  console.log(clientMouseInfo);
  //changeCursor("circle");

  socket.on("mouseDataServer", (data) => {
    //receives msg from server
    //drawPos(data);
  })

  socket.on("updateTeamCircle",(circleTeamInfo)=>{
      //console.log(circleTeamInfo);
      circleTeam = circleTeamInfo;
  })

  socket.on("updateTeamCross",(crossTeamInfo)=>{
      crossTeam = crossTeamInfo;
  })

  socket.on("idTypeMsg", (typeMsg) => {
    //receives msg from server, set client cursor and team
    if (typeMsg.id == socket.id) {
      localPlayerType = typeMsg.type;
      changeCursor(localPlayerType);

    }
  })

  socket.on("updateWinCount",(result)=>{
    if(result == "circle"){
      circleWinCount++;
    }else if(result == "cross"){
      crossWinCount++;
    }if(result == "tie"){
      tieCount++;
    }
  })

  socket.on("updateSlots",(data)=>{
    slots = data;
    console.log(slots);
  })

  socket.on("restartGameReady",()=>{
    mouseMoved();
  })
}


//change the cursor image
function changeCursor(type) {
  if (type == "circle") {
    //document.body.style.cursor = circleURL;
    console.log("Team Circle!");
  } else if (type == "cross") {
    //document.body.style.cursor = crossURL;
    console.log("Team Cross!");
  }
}


function draw() {
  showTimer();
  drawBoard();
  drawPawn();
  drawAllTeams();
}

function drawAllTeams(){
  for(i=0;i<circleTeam.length;i++){
    if(circleTeam[i].id = socket.id){
      image(circleImg, circleTeam[i].mouseX, circleTeam[i].mouseY);
    }else{
      image(circleImg, circleTeam[i].mouseX, circleTeam[i].mouseY);
    }
  }

  for(j=0;j<crossTeam.length;j++){
    image(crossImg, crossTeam[j].mouseX, crossTeam[j].mouseY);
  }


}

function mouseMoved() {
  let tempSlot = getSlotwithXY();
  if(tempSlot != currentSlot){
   
    let refreshSlotInfo = {
      id:socket.id,
      type: localPlayerType,
      newSlot:tempSlot,
      prevSlot:currentSlot
    };
    currentSlot = tempSlot;
    socket.emit("calculateSlots",refreshSlotInfo);
  }
  clientMouseInfo = {
    x: mouseX,
    y: mouseY,
    colorR: r,
    colorG: g,
    colorB: b,
    id: socket.id,
    type: localPlayerType,
    slot: tempSlot
  }
  //send data to server when client moves mouse
  socket.emit("mouseData", clientMouseInfo);
}


function drawPos(data) {
  let c = color(data.colorR, data.colorG, data.colorB);
  fill(c);
  ellipse(data.x, data.y, 10, 10);
}


function drawBoard() {
  background(220);
  line(0, h / 3, w, h / 3);
  line(0, (2 * h) / 3, w, (2 * h) / 3);
  line(w / 3, 0, w / 3, h);
  line((2 * w) / 3, 0, (2 * w) / 3, h);
  //console.log(slots);
}

function drawPawn() {
  let circleX, circleY;
  for (let i = 0; i < 9; i++) {
    let tempPawn = slots[i];
    switch (slots[i]) {
      case 0:
        //console.log("draw nothing on " + i);
        break;
      case 1:
        //circle draw when 1 appears
        circle(pawnXLoc[i], pawnYLoc[i], w / 3);
        break;
      case 2:
        // cross draw when 2 appears
        line(
          pawnXLoc[i] - w / 6,
          pawnYLoc[i] - h / 6,
          pawnXLoc[i] + w / 6,
          pawnYLoc[i] + h / 6
        );
        line(
          pawnXLoc[i] - w / 6,
          pawnYLoc[i] + h / 6,
          pawnXLoc[i] + w / 6,
          pawnYLoc[i] - h / 6
        );
        break;
      default:
      //console.log(`nothing is recorded on this slot`);
    }
  }
}



function getSlotwithXY() {
  let row, col, targetSlot;
  if (mouseX < w / 3) {
    col = 0;
  } else if (mouseX < (2 * w) / 3) {
    col = 1;
  } else {
    col = 2;
  }
  if (mouseY < h / 3) {
    row = 0;
  } else if (mouseY < (2 * h) / 3) {
    row = 1;
  } else {
    row = 2;
  }
  //calculate slots number based on mouseX and mouseY,
  targetSlot = row * 3 + col;
  return targetSlot;
}



function showTimer() {
  currentTime = new Date();
  var tempTime = 10 - currentTime.getSeconds()%10;
  let tempWinCount = "Circle Wins:"+circleWinCount+", Cross Wins:"+ crossWinCount+", Ties: "+tieCount;
let tempPlayerNum = "Circle players: "+circleTeam.length+"; Cross Players: "+ crossTeam.length;
tempSec = currentTime.getSeconds();  
if(tempSec%10 == 0){
    tempTime ="Locking decision!";
    if(isLocking == false){
      isLocking = true;
      //send to server to end vote for this round
      socket.emit("voteEnd",tempSec);
      //code
    }
  }else{
    isLocking = false;
  }
  document.getElementById('playTimer').innerHTML = tempTime;
  document.getElementById('winCount').innerHTML = tempWinCount;
  document.getElementById('teamPlayers').innerHTML = tempPlayerNum;
}
