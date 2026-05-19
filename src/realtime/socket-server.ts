import "dotenv/config";

import { createServer } from "node:http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

const port = Number(process.env.SOCKET_PORT || 4001);

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  },
});

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

const subRedisClient = redisClient.duplicate();

await Promise.all([redisClient.connect(), subRedisClient.connect()]);

io.adapter(createAdapter(redisClient, subRedisClient));

io.on("connection", (socket) => {
  socket.on("organization:join", (organizationId: string) => {
    socket.join(`organization:${organizationId}`);
  });

  socket.on("organization:leave", (organizationId: string) => {
    socket.leave(`organization:${organizationId}`);
  });
});

httpServer.listen(port, () => {
  console.log(`Socket.IO server running on port ${port}`);
});