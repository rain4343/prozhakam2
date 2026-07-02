import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListDepartments, 
  getListDepartmentsQueryKey,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const departmentSchema = z.object({
  name: z.string().min(1, "ناو پێویستە"),
  description: z.string().optional().nullable(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export default function DepartmentsList() {
  const [editingDept, setEditingDept] = useState<{id: number, name: string, description: string | null} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: departments = [], isLoading } = useListDepartments();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "", description: "" },
  });

  const openNewDialog = () => {
    setEditingDept(null);
    form.reset({ name: "", description: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (dept: any) => {
    setEditingDept(dept);
    form.reset({ name: dept.name, description: dept.description || "" });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: DepartmentFormValues) => {
    if (editingDept) {
      updateDept.mutate({ id: editingDept.id, data }, {
        onSuccess: () => {
          toast({ title: "بەشەکە نوێکرایەوە" });
          queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
          setIsDialogOpen(false);
        },
        onError: () => toast({ title: "شکستی هێنا لە نوێکردنەوەی بەشەکە", variant: "destructive" })
      });
    } else {
      createDept.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "بەشەکە زیادکرا" });
          queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
          setIsDialogOpen(false);
        },
        onError: () => toast({ title: "شکستی هێنا لە زیادکردنی بەشەکە", variant: "destructive" })
      });
    }
  };

  const handleDelete = () => {
    if (deptToDelete === null) return;
    deleteDept.mutate({ id: deptToDelete }, {
      onSuccess: () => {
        toast({ title: "بەشەکە سڕایەوە" });
        queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
        setDeptToDelete(null);
      },
      onError: () => {
        toast({ title: "شکستی هێنا لە سڕینەوەی بەشەکە", variant: "destructive" });
        setDeptToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">بەشەکان</h1>
          <p className="text-muted-foreground mt-1">بەڕێوەبردنی یەکەکانی ڕێکخراوە</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="w-4 h-4 ml-2" />
          زیادکردنی بەش
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ناو</TableHead>
              <TableHead>شرۆڤە</TableHead>
              <TableHead className="text-left">کارەکان</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  هیچ بەشێک نەدۆزرایەوە.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-muted-foreground">{dept.description || '-'}</TableCell>
                  <TableCell className="text-left">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(dept)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeptToDelete(dept.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? "دەستکاریکردنی بەش" : "زیادکردنی بەش"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ناو</FormLabel>
                    <FormControl>
                      <Input placeholder="ب.ن. تەکنەلۆجیای زانیاری" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شرۆڤە</FormLabel>
                    <FormControl>
                      <Textarea placeholder="کار و ئەرکی بەشەکە..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex-row-reverse gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>پاشگەزبوونەوە</Button>
                <Button type="submit" disabled={createDept.isPending || updateDept.isPending}>
                  {createDept.isPending || updateDept.isPending ? "پاشەکەوتکردن..." : "پاشەکەوتکردن"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deptToDelete !== null} onOpenChange={(open) => !open && setDeptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>سڕینەوەی بەش</AlertDialogTitle>
            <AlertDialogDescription>
              ئایا دڵنیایت لە سڕینەوەی ئەم بەشە؟ ئەم کارە ناتوانرێت پاشگەزبرێتەوە.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              سڕینەوە
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
