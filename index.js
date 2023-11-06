const PORT = process.env.PORT || 3000;
//creating the express app
let express = require("express");
let app = express();
app.use("/", express.static("public"));
let circleTeam = [];
let crossTeam = [];
let idType;
let slotsCircleRecord = [0, 0, 0, 0, 0, 0, 0, 0, 0];
let slotsCrossRecord = [0, 0, 0, 0, 0, 0, 0, 0, 0];
let isCircleTurn = true;
let slots = [0, 0, 0, 0, 0, 0, 0, 0, 0];
let timerConnectionCounter = 0;
let hasWinnerLine =false;
let lastCheckSecond=-1;  //to help do the vote check every 10 secs, init as -1


//creating the http server 
let http = require("http");
let server = http.createServer(app);

//inititalize socket.io
let io = require("socket.io");
io = new io.Server(server);

// Listen for a new connection
io.sockets.on("connect", (socket) => {

  //assign team for new connected client
  if (circleTeam.length > crossTeam.length) {
    idType = {
      id: socket.id,
      type: "cross",
      mouseX: 0,
      mouseY: 0,
      slotNum: 0
    }
    crossTeam.push(idType);
    slotsCrossRecord[0] += 1;
  } else {
    idType = {
      id: socket.id,
      type: "circle",
      mouseX: 0,
      mouseY: 0,
      slotNum: 0
    }
    circleTeam.push(idType);
    slotsCircleRecord[0] += 1;
  }


  // print number of players for each team
  console.log("[total players]cross:" + crossTeam.length + " circle:" + circleTeam.length);
  //send clients their pawn type
  io.sockets.emit("idTypeMsg", idType);

  socket.on("mouseData", (data) => {
    //when client is moving mouse, data is received at server
    if (data.type == "circle") {
      for (i = 0; i < circleTeam.length; i++) {
        if (data.id == circleTeam[i].id) {
          circleTeam[i].mouseX = data.x;
          circleTeam[i].mouseY = data.y;
        }
      }
      io.sockets.emit("updateTeamCircle", circleTeam);
    } else if (data.type == "cross") {
      for (j = 0; j < crossTeam.length; j++) {
        if (data.id == crossTeam[j].id) {
          crossTeam[j].mouseX = data.x;
          crossTeam[j].mouseY = data.y;
        }
      }
      io.sockets.emit("updateTeamCross", crossTeam);
    }



    //send to all clients
    io.sockets.emit("mouseDataServer", data);
  })

  socket.on("calculateSlots", (data) => {

    if (data.type == "cross") {
      slotsCrossRecord = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (i = 0; i < crossTeam.length; i++) {
        if (crossTeam[i].id == data.id) {
          crossTeam[i].slotNum = data.newSlot;
        }
        slotsCrossRecord[crossTeam[i].slotNum] += 1;
      }
    } else if (data.type == "circle") {
      slotsCircleRecord = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (i = 0; i < circleTeam.length; i++) {
        if (circleTeam[i].id == data.id) {
          circleTeam[i].slotNum = data.newSlot;
        }
        slotsCircleRecord[circleTeam[i].slotNum] += 1;
      }
    }

  })


  //find out the slot with most votes 
  //that from the playing team
  socket.on("voteEnd", (tempTime) => {
    console.log("tempTime:"+ tempTime);
    console.log("lastCheckTime: "+lastCheckSecond);

    //trigger voteEnd when every client's timer is up
    if (tempTime != lastCheckSecond) {
      let tempHighestSlotNum = -1;
      let finalHighestSlotNum = -1;
      lastCheckSecond = tempTime;
      //determine current playing team is...
      if (isCircleTurn) {
        console.log("isCircleTurn: "+isCircleTurn);
        //circle team placing circle!!!
        //1. slotsCircleRecord把已经被棋子占据的格子改成-1
        //2. 找出slotsCircleRecord剩余票数最高的格子
        //3. 选取最多票数的格子，在slots里登记circle
        //4. 检查胜负情况

        //1. 
        let tempSlotsCircleRecord = slotsCircleRecord;
        for (i = 0; i < 9; i++) {
          if (slots[i] == 1 || slots[i] == 2) {
            tempSlotsCircleRecord[i] = -1;
          }
        }

        //2.
        for (j = 0; j < 9; j++) {
          if (tempSlotsCircleRecord[j] > tempHighestSlotNum) {
            tempHighestSlotNum = tempSlotsCircleRecord[j];
            finalHighestSlotNum = j;
          }
        }

        //3.
        slots[finalHighestSlotNum] = 1;
        //4.
        checkResult();
      } else {
        console.log("isCircleTurn: "+isCircleTurn);
        //cross team placing cross!!!
        let tempSlotsCrossRecord = slotsCrossRecord;
        for (i = 0; i < 9; i++) {
          if (slots[i] == 1 || slots[i] == 2) {
            tempSlotsCrossRecord[i] = -1;
          }
        }

        //2.
        for (j = 0; j < 9; j++) {
          if (tempSlotsCrossRecord[j] > tempHighestSlotNum) {
            tempHighestSlotNum = tempSlotsCrossRecord[j];
            finalHighestSlotNum = j;
          }
        }

        //3.
        slots[finalHighestSlotNum] = 2;
        //4.
        checkResult();
      }

    //update slots info to every client
    io.sockets.emit("updateSlots", slots);
  }
  })



//in case of disconnection
socket.on("disconnect", () => {
  let indexCircle = -1;
  let indexCross = -1;
  //console.log("Disconnection : ", socket.id);
  //check the disconnected socket ID, remove it from current player list
  for (i = 0; i < circleTeam.length; i++) {
    if (circleTeam[i].id == socket.id) {
      indexCircle = i;
    }
  }
  if (indexCircle == -1) {    //disconnected player is not in team circle
    for (j = 0; j < crossTeam.length; j++) {     //disconnected player is in team cross
      if (crossTeam[j].id == socket.id) {
        indexCross = j;
      }
    }
    slotsCrossRecord[crossTeam[indexCross].slotNum] -= 1;
    crossTeam.splice(indexCross, 1);
  } else {
    slotsCircleRecord[circleTeam[indexCircle].slotNum] -= 1;
    circleTeam.splice(indexCircle, 1);
  }
  io.sockets.emit("updateTeamCircle", circleTeam);
  io.sockets.emit("updateTeamCross", crossTeam);
  console.log("[total players]cross:" + crossTeam.length + " circle:" + circleTeam.length);
})
})

//run the app on port
server.listen(PORT, () => {
  console.log("server on port ", PORT);
})

function restartGame(){  
  isCircleTurn = true;
  slots = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  timerConnectionCounter = 0;
  hasWinnerLine =false;

  //tell clients to restart, recollect info
  io.sockets.emit("restartGameReady");

}

function checkResult(){
    //4. check the result on the board
    if (slots[0] == slots[1] && slots[2] == slots[1] && slots[0] != 0) {
      //first row
      hasWinnerLine = true;
    } else if (slots[3] == slots[4] && slots[4] == slots[5] && slots[5] != 0) {
      //second row
      hasWinnerLine = true;
    } else if (slots[6] == slots[7] && slots[6] == slots[8] && slots[8] != 0) {
      //third row
      hasWinnerLine = true;
    } else if (slots[0] == slots[3] && slots[3] == slots[6] && slots[6] != 0) {
      //first column
      hasWinnerLine = true;
    } else if (slots[4] == slots[1] && slots[7] == slots[1] && slots[1] != 0) {
      //second column
      hasWinnerLine = true;
    } else if (slots[2] == slots[5] && slots[2] == slots[8] && slots[2] != 0) {
      //third column
      hasWinnerLine = true;
    } else if (slots[0] == slots[4] && slots[0] == slots[8] && slots[0] != 0) {
      //right corner dia
      hasWinnerLine = true;
    } else if (slots[2] == slots[4] && slots[2] == slots[6] && slots[2] != 0) {
      //left corner dia
      hasWinnerLine = true;
    } 

    //1 has winner
    //2 tie
    //3 continue game

    let result="";
    if (hasWinnerLine) {
      if (isCircleTurn == true) {
        console.log("Circle wins!");
        result = "circle";
        io.sockets.emit("updateWinCount", result);
      } else if(isCircleTurn ==false) {
        console.log("Cross wins!");
        result = "cross";
        io.sockets.emit("updateWinCount", result);
      }
      restartGame();
    }else if(slots.includes(0) == false){
      console.log("Tie!");
      result = "tie";
      io.sockets.emit("updateWinCount", result);
      restartGame();
    }else{
      if(isCircleTurn == true){
        isCircleTurn = false;
      }else if(isCircleTurn ==false){
        isCircleTurn = true;
      }
    }
}


//1. setting up sockets
//    -√ setting up an http server
//    -√ setting up socket.io

//2. Ensure that the client can connect to the server via sockets
//    - server recognize the connect
//    - client attempting to connect
    
//3. client draws and sends to server

//4. server receives and sends to all the clients

//5. Clients rx and draw on their screen
