import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListRoles, 
  getListRolesQueryKey,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
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

const roleSchema = z.object({
  name: z.string().min(1, "ناو پێویستە"),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export default function RolesList() {
  const [editingRole, setEditingRole] = useState<{id: number, name: string} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: roles = [], isLoading } = useListRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "" },
  });

  const openNewDialog = () => {
    setEditingRole(null);
    form.reset({ name: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: any) => {
    setEditingRole(role);
    form.reset({ name: role.name });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: RoleFormValues) => {
    if (editingRole) {
      updateRole.mutate({ id: editingRole.id, data }, {
        onSuccess: () => {
          toast({ title: "ئەرکەکە نوێکرایەوە" });
          queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() });
          setIsDialogOpen(false);
        },
        onError: () => toast({ title: "شکستی هێنا لە نوێکردنەوەی ئەرکەکە", variant: "destructive" })
      });
    } else {
      createRole.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "ئەرکەکە زیادکرا" });
          queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() });
          setIsDialogOpen(false);
        },
        onError: () => toast({ title: "شکستی هێنا لە زیادکردنی ئەرکەکە", variant: "destructive" })
      });
    }
  };

  const handleDelete = () => {
    if (roleToDelete === null) return;
    deleteRole.mutate({ id: roleToDelete }, {
      onSuccess: () => {
        toast({ title: "ئەرکەکە سڕایەوە" });
        queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() });
        setRoleToDelete(null);
      },
      onError: () => {
        toast({ title: "شکستی هێنا لە سڕینەوەی ئەرکەکە", variant: "destructive" });
        setRoleToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">ئەرکەکان</h1>
          <p className="text-muted-foreground mt-1">بەڕێوەبردنی مۆڵەتەکانی سیستەم و ئاستەکانی دەستگەی</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="w-4 h-4 ml-2" />
          زیادکردنی ئەرک
        </Button>
      </div>

      <div className="border rounded-md w-full max-w-3xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ناوی ئەرک</TableHead>
              <TableHead className="text-left">کارەکان</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                  هیچ ئەرکێک نەدۆزرایەوە.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-left">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setRoleToDelete(role.id)}>
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingRole ? "دەستکاریکردنی ئەرک" : "زیادکردنی ئەرک"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ناوی ئەرک</FormLabel>
                    <FormControl>
                      <Input placeholder="ب.ن. بەڕێوەبەر" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex-row-reverse gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>پاشگەزبوونەوە</Button>
                <Button type="submit" disabled={createRole.isPending || updateRole.isPending}>
                  {createRole.isPending || updateRole.isPending ? "پاشەکەوتکردن..." : "پاشەکەوتکردن"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={roleToDelete !== null} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>سڕینەوەی ئەرک</AlertDialogTitle>
            <AlertDialogDescription>
              ئایا دڵنیایت لە سڕینەوەی ئەم ئەرکە؟ فەرمانبەرانی ئەم ئەرکە مۆڵەتەکانیان لەدەستدەدەن.
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
