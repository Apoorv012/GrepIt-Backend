import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connDB } from './src/config/db.config.js';
import router from './src/routes/index.routes.js';
import {createServer} from 'http';
import {Server} from 'socket.io';
import prisma from './src/config/db.config.js';

const httpServer = createServer();
const io = new Server(httpServer, {cors: {
    origin: "*"
  }});

io.on("connection", async (socket)=> {

    console.log('socket connected');


    socket.on("leaveRoom" , (roomId, userName)=>{
        socket.leave(roomId);
        socket.disconnect(true);
        socket.to(roomId).broadcast.emit(`User ${userName} has left the room`);
    });

    socket.on("disconnect", (reason)=>{
        console.log('socket disconnected due to ', reason);
    });

});

io.of("/").adapter.on("create-room", (room) => {
    console.log(`room ${room} was created`);
  });
  
  io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);


  });

  io.of('/').adapter.on("leave-room", (room, id) =>{
    console.log(`socket ${id} has left the room ${room}`);
  })



dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/api', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}! 🚀`);
    connDB();
});

app.get('/room/',async  (req, res) => {
    console.log('get rooms');
    const rooms = await prisma.room.findMany();
    res.json(rooms);
});

app.get('/user/',async  (req, res) => {
    console.log('get users');
    const users = await prisma.user.findMany();
    res.json(users);
});

app.delete('/room/delete/:code', async (req, res) => {
    const { code } = req.params;
    const room = await prisma.room.delete({
        where: {
            code: code
        }
    });
    return res.status(200).send("Room deleted");
});

httpServer.listen(process.env.SOCKET_PORT, ()=>{
    console.log(`Socket server is listening on port ${process.env.SOCKET_PORT}`);
});


export {io};