import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useListDocuments, getListDocumentsQueryKey, useCreateDocument, useListUsers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending:   { label: "چاوەڕوانە",  variant: "secondary" },
  forwarded: { label: "نێردراوە",   variant: "default" },
  completed: { label: "تەواوبووە",  variant: "outline" },
  archived:  { label: "ئەرشیفکراوە", variant: "outline" },
};

const docSchema = z.object({
  documentNumber: z.string().min(1, "ژمارەی نوسراو پێویستە"),
  documentDate: z.string().min(1, "بەرواری نوسراو پێویستە"),
  subject: z.string().min(1, "بابەتی نوسراو پێویستە"),
  creatorId: z.coerce.number().min(1, "دروستکەر پێویستە"),
});
type DocFormValues = z.infer<typeof docSchema>;

export default function DocumentsList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents = [], isLoading } = useListDocuments();
  const { data: users = [] } = useListUsers({});
  const createDoc = useCreateDocument();

  const form = useForm<DocFormValues>({
    resolver: zodResolver(docSchema),
    defaultValues: { documentNumber: "", documentDate: new Date().toISOString().split("T")[0], subject: "", creatorId: 0 },
  });

  const onSubmit = (data: DocFormValues) => {
    createDoc.mutate({ data }, {
      onSuccess: (doc) => {
        toast({ title: "نوسراوەکە بە سەرکەوتوویی دروستکرا" });
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        setIsDialogOpen(false);
        form.reset();
        navigate(`/documents/${doc.id}`);
      },
      onError: () => toast({ title: "شکستی هێنا لە دروستکردنی نوسراوەکە", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">نوسراوەکان</h1>
          <p className="text-muted-foreground mt-1">بەڕێوەبردنی ئاڵوگۆڕی نوسراوەکان</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 ml-2" />
          نوسراوی نوێ
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ژمارەی نوسراو</TableHead>
              <TableHead>بەروار</TableHead>
              <TableHead>بابەت</TableHead>
              <TableHead>دروستکەر</TableHead>
              <TableHead>دۆخ</TableHead>
              <TableHead className="text-left">کردارەکان</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="w-8 h-8" />
                    <span>هیچ نوسراوێک نەدۆزرایەوە.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => {
                const status = STATUS_LABELS[doc.currentStatus] ?? { label: doc.currentStatus, variant: "outline" as const };
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono font-medium">{doc.documentNumber}</TableCell>
                    <TableCell>{doc.documentDate}</TableCell>
                    <TableCell className="max-w-xs truncate">{doc.subject}</TableCell>
                    <TableCell>{(doc.creator as any)?.fullName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/documents/${doc.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>دروستکردنی نوسراوی نوێ</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="documentNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ژمارەی نوسراو</FormLabel>
                    <FormControl><Input placeholder="ب.ن. ١٢٣/٢٠٢٤" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="documentDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>بەرواری نوسراو</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel>بابەتی نوسراو</FormLabel>
                  <FormControl><Input placeholder="بابەتی سەرەکی نوسراوەکە..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="creatorId" render={({ field }) => (
                <FormItem>
                  <FormLabel>دروستکراوە لەلایەن</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="فەرمانبەرێک هەڵبژێرە..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="flex-row-reverse gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>پاشگەزبوونەوە</Button>
                <Button type="submit" disabled={createDoc.isPending}>
                  {createDoc.isPending ? "چاوەڕوانبە..." : "دروستکردن"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
