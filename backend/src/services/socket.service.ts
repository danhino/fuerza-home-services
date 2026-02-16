import { Server, Socket } from 'socket.io';

class SocketService {
    private io: Server | null = null;

    public init(server: Server) {
        this.io = server;
        this.io.on('connection', (socket: Socket) => {
            console.log('User connected:', socket.id);

            socket.on('join', (userId: string) => {
                socket.join(userId);
                console.log(`User ${userId} joined room ${userId}`);
            });

            socket.on('technician:location', (data: { techId: string; lat: number; lng: number; trade?: string }) => {
                // For MVP, broadcast to all connected clients so customers can see them on map
                this.io?.emit('technician:moved', data);
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    }

    public emit(event: string, data: any) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    public emitToUser(userId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(userId).emit(event, data);
        }
    }
}

export const socketService = new SocketService();
