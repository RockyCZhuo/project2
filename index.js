const PORT = process.env.PORT || 3000;
//creating the express app
let express = require("express");
let app = express();
app.use("/", express.static("public"));
let circleTeam = [];
let crossTeam = [];
let idType;

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
  } else {
    idType = {
      id: socket.id,
      type: "circle",
      mouseX: 0,
      mouseY: 0,
      slotNum: 0
    }
    circleTeam.push(idType);
    console.log(idType);
  }


  // print number of players for each team
  console.log("[total players]cross:" + crossTeam.length + " circle:" + circleTeam.length);
  //console.log(crossTeam);
  //send clients their pawn type
  io.sockets.emit("idTypeMsg", idType);

  socket.on("mouseData", (data) => {
    //when client is moving mouse
    //console.log(data);



    //send to all clients
    io.sockets.emit("mouseDataServer", data);
  })




  //in case of disconnection
  socket.on("disconnect", () => {
    let indexCircle = -1;
    let indexCross = -1;
    console.log("Disconnection : ", socket.id);
    //check the disconnected socket ID, remove it from current player list
    for (i = 0; i < circleTeam.length; i++) {
      if (circleTeam[i].id == socket.id) {
        indexCircle = i;
      }
    }
    if (indexCircle == -1) {    //disconnected player is in team cross
      for (j = 0; j < crossTeam.length; j++) {    
        if (crossTeam[j].id == socket.id) {
          indexCross = j;
        }
      }
      console.log("Remove 1 cross");
      crossTeam.splice(indexCross, 1);
    }else{
      console.log("remove 1 circle");
      circleTeam.splice(indexCircle, 1);
    }

    console.log("cross:" + crossTeam.length + " circle:" + circleTeam.length);
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
