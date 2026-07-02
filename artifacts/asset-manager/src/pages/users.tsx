import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListUsers, 
  getListUsersQueryKey,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useListDepartments,
  useListRoles
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const userSchema = z.object({
  fullName: z.string().min(1, "ناوی تەواو پێویستە"),
  username: z.string().min(1, "ناوی بەکارهێنەر پێویستە"),
  password: z.string().min(8, "وشەی نهێنی دەبێت لانیکەم ٨ پیت بێت").optional().or(z.literal("")),
  departmentId: z.coerce.number().min(1, "بەش پێویستە"),
  jobTitle: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  roleIds: z.array(z.number()).default([])
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersList() {
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading } = useListUsers({});
  const { data: departments = [] } = useListDepartments();
  const { data: roles = [] } = useListRoles();
  
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { fullName: "", username: "", password: "", departmentId: 0, jobTitle: "", isActive: true, roleIds: [] },
  });

  const openNewDialog = () => {
    setEditingUser(null);
    form.reset({ fullName: "", username: "", password: "", departmentId: 0, jobTitle: "", isActive: true, roleIds: [] });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    form.reset({ 
      fullName: user.fullName, 
      username: user.username, 
      password: "",
      departmentId: user.departmentId, 
      jobTitle: user.jobTitle || "", 
      isActive: user.isActive,
      roleIds: user.roles?.map((r: any) => r.id) || []
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: UserFormValues) => {
    if (editingUser && !data.password) {
      delete data.password;
    }
    
    if (editingUser) {
      updateUser.mutate({ id: editingUser.id, data }, {
        onSuccess: () => {
          toast({ title: "فەرمانبەرەکە نوێکرایەوە" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
          setIsDialogOpen(false);
        },
        onError: () => toast({ title: "شکستی هێنا لە نوێکردنەوەی فەرمانبەرەکە", variant: "destructive" })
      });
    } else {
      if (!data.password) {
        form.setError("password", { message: "وشەی نهێنی پێویستە بۆ فەرمانبەرانی نوێ" });
        return;
      }
      createUser.mutate({ data: data as any }, {
        onSuccess: () => {
          toast({ title: "فەرمانبەرەکە زیادکرا" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
          setIsDialogOpen(false);
        },
        onError: () => toast({ title: "شکستی هێنا لە زیادکردنی فەرمانبەرەکە", variant: "destructive" })
      });
    }
  };

  const handleDelete = () => {
    if (userToDelete === null) return;
    deleteUser.mutate({ id: userToDelete }, {
      onSuccess: () => {
        toast({ title: "فەرمانبەرەکە سڕایەوە" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
        setUserToDelete(null);
      },
      onError: () => {
        toast({ title: "شکستی هێنا لە سڕینەوەی فەرمانبەرەکە", variant: "destructive" });
        setUserToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">فەرمانبەران</h1>
          <p className="text-muted-foreground mt-1">بەڕێوەبردنی دەستگەی سیستەم و ئەرکی ستافەکان</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="w-4 h-4 ml-2" />
          زیادکردنی فەرمانبەر
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>فەرمانبەر</TableHead>
              <TableHead>هۆبە</TableHead>
              <TableHead>ئەرکەکان</TableHead>
              <TableHead>دۆخ</TableHead>
              <TableHead className="text-left">کردارەکان</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  هیچ فەرمانبەرێک نەدۆزرایەوە.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.fullName}</div>
                    <div className="text-sm text-muted-foreground">{user.username}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{user.department?.name ?? 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{user.jobTitle || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map(r => (
                        <Badge key={r.id} variant="secondary" className="font-normal">{r.name}</Badge>
                      ))}
                      {(!user.roles || user.roles.length === 0) && (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">چالاک</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">ناچالاک</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setUserToDelete(user.id)}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "دەستکاریکردنی فەرمانبەر" : "زیادکردنی فەرمانبەر"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ناوی تەواو</FormLabel>
                      <FormControl>
                        <Input placeholder="ئەحمەد کەریم" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ناوی بەکارهێنەر</FormLabel>
                      <FormControl>
                        <Input placeholder="ahmed.k" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وشەی نهێنی {editingUser && "(بەتاڵ بهێڵە بۆ پاراستنی وشەی نهێنی ئێستا)"}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>هۆبە</FormLabel>
                      <Select 
                        value={field.value ? field.value.toString() : ""} 
                        onValueChange={(val) => field.onChange(parseInt(val))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="بژاردنی هۆبە" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ناونیشانی کار</FormLabel>
                      <FormControl>
                        <Input placeholder="ب.ن. شیکەرەوەی IT" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <FormLabel className="mb-2 block">ئەرکەکان</FormLabel>
                  <div className="space-y-2 border rounded-md p-3 max-h-32 overflow-y-auto">
                    {roles.map(role => (
                      <label key={role.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input 
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={form.watch("roleIds").includes(role.id)}
                          onChange={(e) => {
                            const current = form.watch("roleIds");
                            if (e.target.checked) {
                              form.setValue("roleIds", [...current, role.id]);
                            } else {
                              form.setValue("roleIds", current.filter(id => id !== role.id));
                            }
                          }}
                        />
                        <span>{role.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 border rounded-md p-4 flex flex-col items-start justify-center">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between w-full">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">دۆخی ئەکاونت</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            {field.value ? 'چالاک' : 'ناچالاک'}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="flex-row-reverse gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>پاشگەزبوونەوە</Button>
                <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                  {createUser.isPending || updateUser.isPending ? "پاشەکەوتکردن..." : "پاشەکەوتکردنی فەرمانبەر"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={userToDelete !== null} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>سڕینەوەی فەرمانبەر</AlertDialogTitle>
            <AlertDialogDescription>
              ئایا دڵنیایت لە سڕینەوەی ئەم فەرمانبەرە؟ دەستگەیەکەیان یەکسەر لەدەستدەچێت.
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
