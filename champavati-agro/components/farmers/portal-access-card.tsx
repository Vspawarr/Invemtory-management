"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createFarmerLoginAction } from "@/lib/server/actions/farmers";

export function PortalAccessCard({
  farmerId,
  phone,
  hasAccess,
}: {
  farmerId: string;
  phone: string;
  hasAccess: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [granted, setGranted] = useState(hasAccess);

  async function submit() {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const result = await createFarmerLoginAction({ farmerId, password });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Portal access granted.");
    setGranted(true);
    setOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Farmer portal access</CardTitle>
      </CardHeader>
      <CardContent>
        {granted ? (
          <p className="text-sm text-muted-foreground">
            This farmer can sign in with mobile number <span className="font-medium">{phone}</span>.
          </p>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <KeyRound className="size-4" /> Enable portal access
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enable portal access</DialogTitle>
                <DialogDescription>
                  The farmer will sign in using mobile number {phone} and the password you set here.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="portal-password">Initial password</Label>
                <Input
                  id="portal-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : "Grant access"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
