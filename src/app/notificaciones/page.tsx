import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/data";
import { markAllReadAction, openNotificationAction } from "@/app/actions";
import { Button, Card, Empty, PageHeader, fmtDate } from "@/components/ui";

export const metadata = { title: "Notificaciones" };

export default function NotificationsPage() {
  const u = requireUser();
  const items = listNotifications(u.id);
  const unread = items.filter((i) => !i.is_read).length;
  return (
    <>
      <PageHeader title="Notificaciones" description={`${unread} sin leer`}
        action={unread ? <form action={markAllReadAction}><Button variant="cancel" size="sm">Marcar todas como leídas</Button></form> : null} />
      {items.length === 0 ? <Empty title="No tienes notificaciones">Aquí verás los cambios de estado de tus postulaciones y los avisos de la plataforma.</Empty> : (
        <Card className="divide-y">
          {items.map((n) => (
            <form key={n.id} action={openNotificationAction}>
              <input type="hidden" name="id" value={n.id} />
              <button className={`flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-muted/60 ${n.is_read ? "" : "bg-theme/5"}`}>
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.is_read ? "bg-transparent" : "bg-theme"}`} />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{n.title}</span>
                  <span className="block text-sm text-muted-foreground">{n.message}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(n.created_at)}</span>
              </button>
            </form>
          ))}
        </Card>
      )}
    </>
  );
}
