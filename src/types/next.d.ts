import { Server as HTTPServer } from "http";
import { Socket } from "net";
import { Server as IOServer } from "socket.io";

declare module "next" {
  import { NextApiResponse } from "next";
  export interface NextApiResponseServerIO extends NextApiResponse {
    socket: Socket & {
      server: HTTPServer & {
        io?: IOServer;
      };
    };
  }
}




// poiuyghui
// 'l'oiuythhkjiko;
// ;oiuyhghj