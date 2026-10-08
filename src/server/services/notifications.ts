import type { Role } from "@prisma/client";
import { db, type Tx } from "@/server/db";

type Client = Tx | typeof db;

export async function notifyUser(client: Client, userId: string, title: string, message: string, link?: string) {
  await client.notification.create({ data: { userId, title, message, link } });
}

export async function notifyRole(client: Client, roles: Role[], title: string, message: string, link?: string) {
  const users = await client.user.findMany({ where: { role: { in: roles } }, select: { id: true } });
  if (users.length === 0) return;
  await client.notification.createMany({ data: users.map((u) => ({ userId: u.id, title, message, link })) });
}

export async function listNotifications(userId: string, take = 50) {
  return db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take });
}

export async function unreadCount(userId: string) {
  return db.notification.count({ where: { userId, read: false } });
}

export async function markAllRead(userId: string) {
  await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}
