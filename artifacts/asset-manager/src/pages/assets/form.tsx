import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetAsset, 
  getGetAssetQueryKey,
  useCreateAsset,
  useUpdateAsset,
  useListDepartments
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

const assetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  assetTag: z.string().min(1, "Asset Tag is required"),
  description: z.string().optional(),
  departmentId: z.coerce.number().min(1, "Department is required"),
  status: z.enum(["available", "in-use", "maintenance", "retired"]),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export default function AssetForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isNew = !params.id || params.id === "new";
  const assetId = !isNew ? parseInt(params.id!) : 0;

  const { data: asset, isLoading: isLoadingAsset } = useGetAsset(assetId, {
    query: {
      enabled: !isNew,
      queryKey: getGetAssetQueryKey(assetId)
    }
  });

  const { data: departments = [], isLoading: isLoadingDepts } = useListDepartments();

  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      assetTag: "",
      description: "",
      departmentId: 0,
      status: "available",
    },
  });

  useEffect(() => {
    if (asset) {
      form.reset({
        name: asset.name,
        assetTag: asset.assetTag,
        description: asset.description || "",
        departmentId: asset.departmentId,
        status: asset.status as any,
      });
    }
  }, [asset, form]);

  const onSubmit = (data: AssetFormValues) => {
    if (isNew) {
      createAsset.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Asset created successfully" });
          setLocation("/assets");
        },
        onError: () => {
          toast({ title: "Failed to create asset", variant: "destructive" });
        }
      });
    } else {
      updateAsset.mutate({ id: assetId, data }, {
        onSuccess: () => {
          toast({ title: "Asset updated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetAssetQueryKey(assetId) });
          setLocation("/assets");
        },
        onError: () => {
          toast({ title: "Failed to update asset", variant: "destructive" });
        }
      });
    }
  };

  const isSaving = createAsset.isPending || updateAsset.isPending;
  const isLoading = (!isNew && isLoadingAsset) || isLoadingDepts;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => setLocation("/assets")} className="-ml-4">
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back to Assets
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Add New Asset" : "Edit Asset"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. MacBook Pro 16" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assetTag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Tag</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. AST-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional details..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        value={field.value ? field.value.toString() : ""} 
                        onValueChange={(val) => field.onChange(parseInt(val))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="in-use">In Use</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setLocation("/assets")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Asset"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
