import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/Config';
import { useAuthStore } from '../store/useAuthStore';

class MobileSocketService {
    private socket: Socket | null = null;

    public connect() {
        const token = useAuthStore.getState().accessToken;

        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            auth: { token }, // Pass token for authentication if backend supports it in handshake
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
            const user = useAuthStore.getState().user;
            if (user) {
                this.socket?.emit('join', user.id);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public on(event: string, callback: (data: any) => void) {
        this.socket?.on(event, callback);
    }

    public off(event: string) {
        this.socket?.off(event);
    }

    public emit(event: string, data: any) {
        this.socket?.emit(event, data);
    }

    public getSocket() {
        return this.socket;
    }
}

export const socketService = new MobileSocketService();
