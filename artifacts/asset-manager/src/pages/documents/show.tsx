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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, Send, User, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "دروستکرا") return "secondary";
  if (status.startsWith("ئاڕاستەکرا")) return "default";
  return "outline";
}

function getActionIcon(action: string) {
  if (action.includes("دروستکرا")) return <CheckCircle2 className="w-4 h-4" />;
  if (action.includes("ئاڕاستەکرا")) return <Send className="w-4 h-4" />;
  return <Clock className="w-4 h-4" />;
}

function getActionColor(action: string) {
  if (action.includes("دروستکرا")) return "bg-green-100 text-green-700";
  if (action.includes("ئاڕاستەکرا")) return "bg-orange-100 text-orange-700";
  return "bg-blue-100 text-blue-700";
}

const forwardSchema = z.object({
  userId: z.coerce.number().min(1, "ئەو کەسەی ئاڕاستەدەکات پێویستە"),
  departmentId: z.coerce.number().min(1, "هۆبە پێویستە"),
  notes: z.string().optional(),
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
    defaultValues: { userId: 0, departmentId: 0, notes: "" },
  });

  const onForward = (data: ForwardFormValues) => {
    forward.mutate({ id, data: { userId: data.userId, departmentId: data.departmentId, notes: data.notes || undefined } }, {
      onSuccess: () => {
        toast({ title: "نوسراوەکە بە سەرکەوتوویی ئاڕاستەکرا" });
        queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
        setIsForwardOpen(false);
        form.reset({ userId: 0, departmentId: 0, notes: "" });
      },
      onError: () => toast({ title: "شکستی هێنا لە ئاڕاستەکردنی نوسراوەکە", variant: "destructive" }),
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

  const statusVariant = getStatusVariant(doc.currentStatus);

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
        <Badge variant={statusVariant} className="text-sm px-3 py-1 shrink-0">{doc.currentStatus}</Badge>
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
          <div className="flex gap-2 items-center">
            <span className="text-muted-foreground shrink-0">دۆخی ئێستا:</span>
            <Badge variant={statusVariant}>{doc.currentStatus}</Badge>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="font-semibold">مێژووی جووڵەی نوسراو</h2>
          <Button size="sm" onClick={() => setIsForwardOpen(true)}>
            <Send className="w-3.5 h-3.5 ml-2" />
            ئاڕاستەکردنی نوسراو
          </Button>
        </div>

        {doc.logs.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">هیچ جووڵەیەک تۆمارنەکراوە.</p>
        ) : (
          <div className="space-y-1">
            {doc.logs.map((log: any, idx: number) => (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>
                  {idx < doc.logs.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1 mb-1 min-h-[12px]" />}
                </div>
                <div className="pb-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{log.action}</span>
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
            <DialogTitle>ئاڕاستەکردنی نوسراو</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onForward)} className="space-y-4">
              <FormField control={form.control} name="userId" render={({ field }) => (
                <FormItem>
                  <FormLabel>ئاڕاستەکەر (بەکارهێنەر)</FormLabel>
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
              <FormField control={form.control} name="departmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>ئاڕاستەکرا بۆ هۆبە</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="هۆبەیەک هەڵبژێرە..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
                  {forward.isPending ? "چاوەڕوانبە..." : "ئاڕاستەکردن"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
