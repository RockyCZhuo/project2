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
  //console.log(crossTeam);
  //send clients their pawn type
  io.sockets.emit("idTypeMsg", idType);

  socket.on("mouseData", (data) => {
    //when client is moving mouse, data is received at server
    //console.log(data);
    if (data.type == "circle") {
      for (i = 0; i < circleTeam.length; i++) {
        if (data.id == circleTeam[i].id) {
          circleTeam[i].mouseX = data.x;
          circleTeam[i].mouseY = data.y;
        }
      }
      io.sockets.emit("updateTeamCircle",circleTeam);
    } else if (data.type == "cross") {
      for (j = 0; j < crossTeam.length; j++) {
        if (data.id == crossTeam[j].id) {
          crossTeam[j].mouseX = data.x;
          crossTeam[j].mouseY = data.y;
        }
      }
      io.sockets.emit("updateTeamCross",crossTeam);
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

    console.log("[total players]cross:" + crossTeam.length + " circle:" + circleTeam.length);
  })
})

//run the app on port
server.listen(PORT, () => {
  console.log("server on port ", PORT);
})



/*
1. setting up sockets
    -√ setting up an http server
    -√ setting up socket.io

2. Ensure that the client can connect to the server via sockets
    - server recognize the connect
    - client attempting to connect
    
3. client draws and sends to server

4. server receives and sends to all the clients

5. Clients rx and draw on their screen

*/
