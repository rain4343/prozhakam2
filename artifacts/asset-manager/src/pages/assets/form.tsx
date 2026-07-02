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
import { ChevronRight } from "lucide-react";

const assetSchema = z.object({
  name: z.string().min(1, "ناو پێویستە"),
  assetTag: z.string().min(1, "تاگی کەرەستە پێویستە"),
  description: z.string().optional(),
  departmentId: z.coerce.number().min(1, "بەش پێویستە"),
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
          toast({ title: "کەرەستەکە زیادکرا" });
          setLocation("/assets");
        },
        onError: () => {
          toast({ title: "شکستی هێنا لە زیادکردنی کەرەستەکە", variant: "destructive" });
        }
      });
    } else {
      updateAsset.mutate({ id: assetId, data }, {
        onSuccess: () => {
          toast({ title: "کەرەستەکە نوێکرایەوە" });
          queryClient.invalidateQueries({ queryKey: getGetAssetQueryKey(assetId) });
          setLocation("/assets");
        },
        onError: () => {
          toast({ title: "شکستی هێنا لە نوێکردنەوەی کەرەستەکە", variant: "destructive" });
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
      <Button variant="ghost" onClick={() => setLocation("/assets")} className="-mr-4">
        <ChevronRight className="w-4 h-4 ml-2" />
        گەڕانەوە بۆ کەرەستەکان
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "زیادکردنی کەرەستەی نوێ" : "دەستکاریکردنی کەرەستە"}</CardTitle>
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
                      <FormLabel>ناوی کەرەستە</FormLabel>
                      <FormControl>
                        <Input placeholder="ب.ن. MacBook Pro 16" {...field} />
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
                      <FormLabel>تاگی کەرەستە</FormLabel>
                      <FormControl>
                        <Input placeholder="ب.ن. IT-001" {...field} />
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
                    <FormLabel>شرۆڤە</FormLabel>
                    <FormControl>
                      <Textarea placeholder="زانیاری زیاتر..." {...field} />
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
                      <FormLabel>بەش</FormLabel>
                      <Select 
                        value={field.value ? field.value.toString() : ""} 
                        onValueChange={(val) => field.onChange(parseInt(val))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="بژاردنی بەش" />
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
                      <FormLabel>دۆخ</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="بژاردنی دۆخ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">بەردەستە</SelectItem>
                          <SelectItem value="in-use">لە بەکارهێنان</SelectItem>
                          <SelectItem value="maintenance">چاکسازی</SelectItem>
                          <SelectItem value="retired">وەستاو</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-start gap-2 pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "پاشەکەوتکردن..." : "پاشەکەوتکردنی کەرەستە"}
                </Button>
                <Button variant="outline" type="button" onClick={() => setLocation("/assets")}>
                  پاشگەزبوونەوە
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
