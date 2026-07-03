import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useLocation } from "wouter";
import {
  useGetDocument,
  getGetDocumentQueryKey,
  useForwardDocument,
  useListUsers,
  useListDepartments,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowRight, ArrowLeft, CheckCircle2, Clock, Send, User, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending:   { label: "چاوەڕوانە",   variant: "secondary" },
  forwarded: { label: "نێردراوە",    variant: "default" },
  completed: { label: "تەواوبووە",   variant: "outline" },
  archived:  { label: "ئەرشیفکراوە", variant: "outline" },
};

const ACTION_LABELS: Record<string, string> = {
  created:   "دروستکرا",
  forwarded: "نێردرا",
  completed: "تەواوکرا",
  archived:  "ئەرشیفکرا",
};

const forwardSchema = z.object({
  fromUserId: z.coerce.number().min(1, "نێردەر پێویستە"),
  toDepartmentId: z.coerce.number().optional(),
  toUserId: z.coerce.number().optional(),
  note: z.string().optional(),
  newStatus: z.string().optional(),
});
type ForwardFormValues = z.infer<typeof forwardSchema>;

export default function DocumentShow() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, navigate] = useLocation();
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: doc, isLoading } = useGetDocument(id);
  const { data: users = [] } = useListUsers({});
  const { data: departments = [] } = useListDepartments();
  const forward = useForwardDocument();

  const form = useForm<ForwardFormValues>({
    resolver: zodResolver(forwardSchema),
    defaultValues: { fromUserId: 0, note: "", newStatus: "forwarded" },
  });

  const onForward = (data: ForwardFormValues) => {
    const payload: any = { fromUserId: data.fromUserId, note: data.note };
    if (data.toDepartmentId) payload.toDepartmentId = data.toDepartmentId;
    if (data.toUserId) payload.toUserId = data.toUserId;
    if (data.newStatus) payload.newStatus = data.newStatus;

    forward.mutate({ id, data: payload }, {
      onSuccess: () => {
        toast({ title: "نوسراوەکە نێردرا" });
        queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
        setIsForwardOpen(false);
        form.reset();
      },
      onError: () => toast({ title: "شکستی هێنا لە نێردانی نوسراوەکە", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>نوسراوەکە نەدۆزرایەوە.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/documents")}>
          گەڕانەوە بۆ لیستەکە
        </Button>
      </div>
    );
  }

  const status = STATUS_LABELS[doc.currentStatus] ?? { label: doc.currentStatus, variant: "outline" as const };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{doc.subject}</h1>
          <p className="text-muted-foreground text-sm">ژمارە: {doc.documentNumber} · بەروار: {doc.documentDate}</p>
        </div>
        <Badge variant={status.variant} className="text-sm px-3 py-1">{status.label}</Badge>
      </div>

      <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
        <h2 className="font-semibold text-base border-b pb-2">زانیاری نوسراو</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">ژمارەی نوسراو:</span>
            <span className="font-mono mr-2">{doc.documentNumber}</span>
          </div>
          <div>
            <span className="text-muted-foreground">بەرواری نوسراو:</span>
            <span className="mr-2">{doc.documentDate}</span>
          </div>
          <div>
            <span className="text-muted-foreground">دروستکەر:</span>
            <span className="mr-2">{(doc.creator as any)?.fullName ?? "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">دۆخی ئێستا:</span>
            <Badge variant={status.variant} className="mr-2">{status.label}</Badge>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="font-semibold text-base">مێژووی جووڵەی نوسراو</h2>
          <Button size="sm" onClick={() => setIsForwardOpen(true)}>
            <Send className="w-3.5 h-3.5 ml-2" />
            نێردانی نوسراو
          </Button>
        </div>

        {doc.logs.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">هیچ جووڵەیەک تۆمارنەکراوە.</p>
        ) : (
          <div className="space-y-3">
            {doc.logs.map((log: any, idx: number) => (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    log.action === "created" ? "bg-green-100 text-green-700" :
                    log.action === "completed" ? "bg-blue-100 text-blue-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {log.action === "created" ? <CheckCircle2 className="w-4 h-4" /> :
                     log.action === "forwarded" ? <Send className="w-4 h-4" /> :
                     <Clock className="w-4 h-4" />}
                  </div>
                  {idx < doc.logs.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{ACTION_LABELS[log.action] ?? log.action}</span>
                    {log.fromUser && (
                      <span className="text-muted-foreground text-xs flex items-center gap-1">
                        <User className="w-3 h-3" /> {log.fromUser.fullName}
                      </span>
                    )}
                    {log.toDepartment && (
                      <span className="text-muted-foreground text-xs flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        <Building2 className="w-3 h-3" /> {log.toDepartment.name}
                      </span>
                    )}
                    {log.toUser && (
                      <span className="text-muted-foreground text-xs flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        <User className="w-3 h-3" /> {log.toUser.fullName}
                      </span>
                    )}
                  </div>
                  {log.note && <p className="text-sm text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-1">{log.note}</p>}
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {new Date(log.timestamp).toLocaleString("ar-IQ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isForwardOpen} onOpenChange={setIsForwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>نێردانی نوسراو</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onForward)} className="space-y-4">
              <FormField control={form.control} name="fromUserId" render={({ field }) => (
                <FormItem>
                  <FormLabel>نێردەر</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="فەرمانبەرێک هەڵبژێرە..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="toDepartmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>بۆ هۆبە (ئارەزوومەندانە)</FormLabel>
                  <Select onValueChange={(v) => field.onChange(v ? Number(v) : undefined)} value={field.value ? String(field.value) : ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="هۆبەیەک هەڵبژێرە..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">— هیچ —</SelectItem>
                      {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="toUserId" render={({ field }) => (
                <FormItem>
                  <FormLabel>بۆ فەرمانبەر (ئارەزوومەندانە)</FormLabel>
                  <Select onValueChange={(v) => field.onChange(v ? Number(v) : undefined)} value={field.value ? String(field.value) : ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="فەرمانبەرێک هەڵبژێرە..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">— هیچ —</SelectItem>
                      {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="newStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>دۆخی نوێ</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? "forwarded"}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="forwarded">نێردراوە</SelectItem>
                      <SelectItem value="completed">تەواوبووە</SelectItem>
                      <SelectItem value="archived">ئەرشیفکراوە</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="note" render={({ field }) => (
                <FormItem>
                  <FormLabel>تێبینی (ئارەزوومەندانە)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="تێبینیەکی زیاد بکە..." {...field} />
                  </FormControl>
                </FormItem>
              )} />
              <DialogFooter className="flex-row-reverse gap-2">
                <Button type="button" variant="outline" onClick={() => setIsForwardOpen(false)}>پاشگەزبوونەوە</Button>
                <Button type="submit" disabled={forward.isPending}>
                  {forward.isPending ? "چاوەڕوانبە..." : "نێردان"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
