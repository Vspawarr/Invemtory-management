"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/admin/switch";
import { DeleteButton } from "@/components/admin/delete-button";
import { updateAdmin, deleteAdmin } from "@/actions/users";

export function AdminUserRow({
  user,
  isSelf,
}: {
  user: { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string };
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (role: string, isActive: boolean) => {
    const fd = new FormData();
    fd.set("role", role);
    if (isActive) fd.set("isActive", "true");
    startTransition(async () => {
      const result = await updateAdmin(user.id, fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Updated.");
      router.refresh();
    });
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.name} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Select
          value={user.role}
          onValueChange={(role) => submit(role, user.isActive)}
          disabled={isPending || isSelf}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="SALES">Sales</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={user.isActive}
            disabled={isPending || isSelf}
            onCheckedChange={(checked) => submit(user.role, checked)}
          />
          <Badge variant={user.isActive ? "success" : "muted"}>{user.isActive ? "Active" : "Inactive"}</Badge>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{user.createdAt}</TableCell>
      <TableCell className="text-right">
        {!isSelf && <DeleteButton id={user.id} action={deleteAdmin} title={`Remove ${user.name}?`} />}
      </TableCell>
    </TableRow>
  );
}
