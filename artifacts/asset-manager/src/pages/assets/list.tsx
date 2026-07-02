import { useState } from "react";
import { Link } from "wouter";
import { 
  useListAssets, 
  useListDepartments,
  useDeleteAsset,
  getListAssetsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'available': 'بەردەستە',
    'in-use': 'لە بەکارهێنان',
    'maintenance': 'چاکسازی',
    'retired': 'وەستاو',
  };
  return labels[status] ?? status;
};

export default function AssetsList() {
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: departments = [] } = useListDepartments();
  const { data: assets = [], isLoading } = useListAssets({
    departmentId: departmentId !== "all" ? parseInt(departmentId) : undefined,
    status: status !== "all" ? (status as any) : undefined,
  });

  const deleteAsset = useDeleteAsset();

  const handleDelete = () => {
    if (assetToDelete === null) return;
    deleteAsset.mutate({ id: assetToDelete }, {
      onSuccess: () => {
        toast({ title: "کەرەستەکە سڕایەوە" });
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey({}) });
        setAssetToDelete(null);
      },
      onError: () => {
        toast({ title: "شکستی هێنا لە سڕینەوەی کەرەستەکە", variant: "destructive" });
        setAssetToDelete(null);
      }
    });
  };

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(search.toLowerCase()) || 
    asset.assetTag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">کەرەستەکان</h1>
          <p className="text-muted-foreground mt-1">بەڕێوەبردنی کەرەستەی ماددی و تەکنەلۆجی</p>
        </div>
        <Button asChild>
          <Link href="/assets/new">
            <Plus className="w-4 h-4 ml-2" />
            زیادکردنی کەرەستە
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="گەڕان بە ناو یان تاگ..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger>
              <SelectValue placeholder="هەموو هۆبەکان" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">هەموو هۆبەکان</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="هەموو دۆخەکان" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">هەموو دۆخەکان</SelectItem>
              <SelectItem value="available">بەردەستە</SelectItem>
              <SelectItem value="in-use">لە بەکارهێنان</SelectItem>
              <SelectItem value="maintenance">چاکسازی</SelectItem>
              <SelectItem value="retired">وەستاو</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>ناو</TableHead>
              <TableHead>هۆبە</TableHead>
              <TableHead>دۆخ</TableHead>
              <TableHead className="text-left">کردارەکان</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : filteredAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  هیچ کەرەستەیەک نەدۆزرایەوە.
                </TableCell>
              </TableRow>
            ) : (
              filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">{asset.assetTag}</TableCell>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell>{asset.department?.name ?? 'N/A'}</TableCell>
                  <TableCell>
                    <div className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      asset.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      asset.status === 'in-use' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      asset.status === 'maintenance' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {statusLabel(asset.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/assets/${asset.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setAssetToDelete(asset.id)}>
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

      <AlertDialog open={assetToDelete !== null} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>سڕینەوەی کەرەستە</AlertDialogTitle>
            <AlertDialogDescription>
              ئایا دڵنیایت لە سڕینەوەی ئەم کەرەستەیە؟ ئەم کارە ناتوانرێت پاشگەزبرێتەوە.
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
