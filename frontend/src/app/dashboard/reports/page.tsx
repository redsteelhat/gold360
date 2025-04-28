'use client';

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Eye, 
  Download, 
  FileText, 
  Printer, 
  BarChart, 
  Share2,
  Edit,
  AlertTriangle
} from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = React.useState("sales");
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const [reportData, setReportData] = React.useState<any[]>([]);
  const { toast } = useToast();

  // Mock sales data for demonstration
  const mockSalesData = [
    { id: 1, date: "2023-11-01", orderId: "ORD-001", customer: "John Doe", total: 1250.99, status: "Completed" },
    { id: 2, date: "2023-11-02", orderId: "ORD-002", customer: "Jane Smith", total: 859.50, status: "Completed" },
    { id: 3, date: "2023-11-03", orderId: "ORD-003", customer: "Robert Johnson", total: 429.99, status: "Completed" },
    { id: 4, date: "2023-11-04", orderId: "ORD-004", customer: "Lisa Brown", total: 720.25, status: "Completed" },
    { id: 5, date: "2023-11-05", orderId: "ORD-005", customer: "Michael Wilson", total: 1875.00, status: "Completed" },
  ];

  // Mock inventory data for demonstration
  const mockInventoryData = [
    { id: 1, sku: "PRD001", name: "Gold Necklace", inStock: 15, reserved: 2, available: 13, value: 18750.00 },
    { id: 2, sku: "PRD002", name: "Silver Bracelet", inStock: 28, reserved: 3, available: 25, value: 14000.00 },
    { id: 3, sku: "PRD003", name: "Diamond Ring", inStock: 8, reserved: 1, available: 7, value: 24000.00 },
    { id: 4, sku: "PRD004", name: "Gold Earrings", inStock: 20, reserved: 0, available: 20, value: 9000.00 },
    { id: 5, sku: "PRD005", name: "Platinum Watch", inStock: 5, reserved: 2, available: 3, value: 25000.00 },
  ];

  const generateReport = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date range required",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      
      if (reportType === "sales") {
        setReportData(mockSalesData);
      } else if (reportType === "inventory") {
        setReportData(mockInventoryData);
      }
      
      toast({
        title: "Report Generated",
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report for the selected period has been generated.`,
      });
    }, 1500);
  };

  const downloadReport = () => {
    toast({
      title: "Report Downloaded",
      description: "Your report has been downloaded successfully.",
    });
  };

  // İşlem fonksiyonları
  const handleViewDetails = (id: number, type: string) => {
    toast({
      title: "View Details",
      description: `Viewing details for ${type} #${id}`,
    });
  };

  const handlePrintItem = (id: number, type: string) => {
    toast({
      title: "Print",
      description: `Printing ${type} #${id}`,
    });
  };

  const handleExportItem = (id: number, type: string) => {
    toast({
      title: "Export",
      description: `Exporting ${type} #${id} to PDF`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>Select report type and date range to generate reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <label htmlFor="report-type" className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Report</SelectItem>
                    <SelectItem value="inventory">Inventory Report</SelectItem>
                    <SelectItem value="customers">Customer Report</SelectItem>
                    <SelectItem value="products">Product Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <DatePicker date={startDate} setDate={setStartDate} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <DatePicker date={endDate} setDate={setEndDate} />
              </div>
              <div className="space-y-2 flex items-end">
                <Button onClick={generateReport} disabled={loading} className="w-full">
                  {loading ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
              </CardTitle>
              <CardDescription>
                {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={downloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={reportType}>
              <TabsList className="mb-4">
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>

              <TabsContent value="sales">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSalesData.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.date}</TableCell>
                        <TableCell>{sale.orderId}</TableCell>
                        <TableCell>{sale.customer}</TableCell>
                        <TableCell className="text-right">${sale.total.toFixed(2)}</TableCell>
                        <TableCell>{sale.status}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(sale.id, "order")}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Order</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintItem(sale.id, "invoice")}>
                                <Printer className="mr-2 h-4 w-4" />
                                <span>Print Invoice</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportItem(sale.id, "report")}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Export as PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({
                                title: "Analysis",
                                description: `Analyzing order ${sale.orderId}`
                              })}>
                                <BarChart className="mr-2 h-4 w-4" />
                                <span>Analyze</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="inventory">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-right">In Stock</TableHead>
                      <TableHead className="text-right">Reserved</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockInventoryData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.inStock}</TableCell>
                        <TableCell className="text-right">{item.reserved}</TableCell>
                        <TableCell className="text-right">{item.available}</TableCell>
                        <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(item.id, "product")}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Product</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({
                                title: "Inventory Adjustment",
                                description: `Adjusting inventory for ${item.name}`
                              })}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Adjust Stock</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportItem(item.id, "inventory report")}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Export Report</span>
                              </DropdownMenuItem>
                              {item.available < 5 && (
                                <DropdownMenuItem onClick={() => toast({
                                  title: "Low Stock Alert",
                                  description: `Creating reorder for ${item.name}`,
                                  variant: "destructive"
                                })}>
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  <span>Reorder Stock</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 