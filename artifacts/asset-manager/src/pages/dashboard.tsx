import { useGetDashboardStats, useGetAssetsByDepartment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Users, Building2, ShieldCheck, AlertCircle } from "lucide-react";

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'available': 'بەردەستە',
    'in-use': 'لە بەکارهێنان',
    'maintenance': 'چاکسازی',
    'retired': 'وەستاو',
  };
  return labels[status] ?? status;
};

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetDashboardStats();
  const { data: deptStats, isLoading: isLoadingDeptStats } = useGetAssetsByDepartment();

  if (isLoading || isLoadingDeptStats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">داشبۆرد</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <AlertCircle className="h-10 w-10 mb-4" />
        <h2 className="text-xl font-semibold">شکستی هێنا لە بارکردنی ئامارەکان</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">پێشاندانی گشتی</h1>
        <p className="text-muted-foreground mt-1">ئامارە گشتیەکانی ڕێکخراوەکە.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">کۆی کەرەستەکان</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAssets.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">بەشەکان</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalDepartments.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">کۆی فەرمانبەران</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ئەرکەکانی سیستەم</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRoles.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>دۆخی کەرەستەکان</CardTitle>
            <CardDescription>دۆخی ئێستای هەموو کەرەستەکان</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.assetsByStatus.map((statusItem) => (
                <div key={statusItem.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      statusItem.status === 'available' ? 'bg-green-500' :
                      statusItem.status === 'in-use' ? 'bg-blue-500' :
                      statusItem.status === 'maintenance' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="font-medium">{statusLabel(statusItem.status)}</span>
                  </div>
                  <span className="text-muted-foreground">{statusItem.count}</span>
                </div>
              ))}
              {stats.assetsByStatus.length === 0 && (
                <p className="text-sm text-muted-foreground">هیچ کەرەستەیەک نەدۆزرایەوە.</p>
              )}
            </div>
            
            {deptStats && deptStats.length > 0 && (
              <div className="mt-8">
                <h4 className="text-sm font-semibold mb-4">بەپێی بەش</h4>
                <div className="space-y-4">
                  {deptStats.map(ds => (
                    <div key={ds.departmentId} className="flex justify-between items-center text-sm">
                      <span>{ds.departmentName}</span>
                      <span className="text-muted-foreground font-medium">{ds.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>کەرەستە دواکەوتووەکان</CardTitle>
            <CardDescription>کەرەستەکانی نوێترین تۆمارکراو لە سیستەم</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentAssets && stats.recentAssets.length > 0 ? (
              <div className="space-y-4">
                {stats.recentAssets.map(asset => (
                  <div key={asset.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm text-muted-foreground">{asset.assetTag}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      {asset.department && (
                        <div className="text-sm text-muted-foreground">{asset.department.name}</div>
                      )}
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        asset.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        asset.status === 'in-use' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        asset.status === 'maintenance' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {statusLabel(asset.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">هیچ کەرەستەیەکی نوێ نییە.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
