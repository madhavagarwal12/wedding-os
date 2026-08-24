import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";

export default async function NotificationsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">
              Mark all read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <div className="divide-y rounded-lg border bg-background">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start justify-between gap-4 p-3 text-sm",
                !n.isRead && "bg-muted/40"
              )}
            >
              <div className="min-w-0">
                {n.link ? (
                  <Link href={n.link} className="font-medium hover:underline">
                    {n.title}
                  </Link>
                ) : (
                  <div className="font-medium">{n.title}</div>
                )}
                {n.message && (
                  <p className="mt-0.5 text-muted-foreground">{n.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(n.createdAt)}
                </p>
              </div>
              {!n.isRead && (
                <form action={markNotificationReadAction.bind(null, n.id)}>
                  <Button type="submit" variant="ghost" size="sm">
                    Mark read
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
