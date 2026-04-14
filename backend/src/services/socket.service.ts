import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

            // Join a specific room (e.g. job_xxx for real-time tracking)
            socket.on('join_room', (room: string) => {
                socket.join(room);
                console.log(`Socket ${socket.id} joined room ${room}`);
            });

            socket.on('leave_room', (room: string) => {
                socket.leave(room);
                console.log(`Socket ${socket.id} left room ${room}`);
            });

            // ── Technician goes online — join the technicians room ──
            socket.on('technician_online', (data: {
                technicianId: string;
                trade: string;
                name: string;
                rating: number;
            }) => {
                socket.join('technicians');
                socket.data.technicianId = data.technicianId;
                socket.data.trade = data.trade;
                // Broadcast to all connected customers
                this.io?.emit('technician_came_online', {
                    id: data.technicianId,
                    trade: data.trade,
                    name: data.name,
                    rating: data.rating,
                    isOnline: true,
                });
                console.log(`Technician ${data.technicianId} came online (${data.trade})`);
            });

            // ── Technician location update — relay to all customers ──
            socket.on('location_update', (data: {
                lat: number;
                lng: number;
            }) => {
                const technicianId = socket.data.technicianId;
                if (!technicianId) return;

                // Relay to all sockets (customers listening to the map)
                this.io?.emit('technician_location', {
                    id: technicianId,
                    lat: data.lat,
                    lng: data.lng,
                    trade: socket.data.trade,
                });

                // Also emit to any job room this technician is in
                // so the tracking screen updates
                socket.rooms.forEach((room: string) => {
                    if (room.startsWith('job_')) {
                        this.io?.to(room).emit('location_update', {
                            technicianId,
                            lat: data.lat,
                            lng: data.lng,
                        });
                    }
                });

                // Persist to DB (fire and forget)
                prisma.technicianProfile.update({
                    where: { userId: technicianId },
                    data: { currentLat: data.lat, currentLng: data.lng },
                }).catch((err: any) => console.error('[Socket] Failed to persist location:', err));
            });

            // ── Legacy event — keep for backward compatibility ──
            socket.on('technician:location', (data: { techId: string; lat: number; lng: number; trade?: string }) => {
                this.io?.emit('technician:moved', data);
            });

            // ── Technician goes offline ──
            socket.on('technician_offline', (data: {
                technicianId?: string;
            }) => {
                const id = data?.technicianId ?? socket.data.technicianId;
                if (id) {
                    this.io?.emit('technician_went_offline', { id });
                    console.log(`Technician ${id} went offline`);
                }
                socket.leave('technicians');
            });

            // ── On disconnect, notify customers ──
            socket.on('disconnect', () => {
                if (socket.data.technicianId) {
                    this.io?.emit('technician_went_offline', {
                        id: socket.data.technicianId,
                    });
                    console.log(`Technician ${socket.data.technicianId} disconnected`);
                } else {
                    console.log('User disconnected:', socket.id);
                }
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

    public emitToRoom(room: string, event: string, data: any) {
        if (this.io) {
            this.io.to(room).emit(event, data);
        }
    }
}

export const socketService = new SocketService();

