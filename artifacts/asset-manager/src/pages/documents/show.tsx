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
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, Send, User, Clock, FileText } from "lucide-react";
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
  userId: z.coerce.number().min(1, "بەکارهێنەر پێویستە"),
  notes: z.string().optional(),
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
  const forward = useForwardDocument();

  const form = useForm<ForwardFormValues>({
    resolver: zodResolver(forwardSchema),
    defaultValues: { userId: 0, notes: "", newStatus: "forwarded" },
  });

  const onForward = (data: ForwardFormValues) => {
    forward.mutate({ id, data: { userId: data.userId, notes: data.notes || undefined, newStatus: data.newStatus || "forwarded" } }, {
      onSuccess: () => {
        toast({ title: "نوسراوەکە نێردرا" });
        queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
        setIsForwardOpen(false);
        form.reset({ userId: 0, notes: "", newStatus: "forwarded" });
      },
      onError: () => toast({ title: "شکستی هێنا لە نێردانی نوسراوەکە", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
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
          <p className="text-muted-foreground text-sm mt-0.5">
            ژمارە: <span className="font-mono">{doc.documentNumber}</span> · بەروار: {doc.documentDate}
          </p>
        </div>
        <Badge variant={status.variant} className="text-sm px-3 py-1">{status.label}</Badge>
      </div>

      <div className="border rounded-lg p-6 space-y-3 bg-muted/30">
        <h2 className="font-semibold border-b pb-2">زانیاری نوسراو</h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground shrink-0">ژمارەی نوسراو:</span>
            <span className="font-mono font-medium">{doc.documentNumber}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground shrink-0">بەرواری نوسراو:</span>
            <span>{doc.documentDate}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground shrink-0">دروستکەر:</span>
            <span>{(doc.creator as any)?.fullName ?? "—"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground shrink-0">دۆخی ئێستا:</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="font-semibold">مێژووی جووڵەی نوسراو</h2>
          <Button size="sm" onClick={() => setIsForwardOpen(true)}>
            <Send className="w-3.5 h-3.5 ml-2" />
            نێردانی نوسراو
          </Button>
        </div>

        {doc.logs.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">هیچ جووڵەیەک تۆمارنەکراوە.</p>
        ) : (
          <div className="space-y-1">
            {doc.logs.map((log: any, idx: number) => (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    log.action === "created"   ? "bg-green-100 text-green-700" :
                    log.action === "completed" ? "bg-blue-100  text-blue-700"  :
                                                 "bg-orange-100 text-orange-700"
                  }`}>
                    {log.action === "created"   ? <CheckCircle2 className="w-4 h-4" /> :
                     log.action === "forwarded" ? <Send         className="w-4 h-4" /> :
                                                  <Clock        className="w-4 h-4" />}
                  </div>
                  {idx < doc.logs.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1 mb-1 min-h-[12px]" />}
                </div>
                <div className="pb-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{ACTION_LABELS[log.action] ?? log.action}</span>
                    {log.user && (
                      <span className="text-muted-foreground text-xs flex items-center gap-1">
                        <User className="w-3 h-3" /> {log.user.fullName}
                      </span>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-sm text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-1 break-words">{log.notes}</p>
                  )}
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
              <FormField control={form.control} name="userId" render={({ field }) => (
                <FormItem>
                  <FormLabel>نێردراوە لەلایەن</FormLabel>
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
              <FormField control={form.control} name="notes" render={({ field }) => (
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
