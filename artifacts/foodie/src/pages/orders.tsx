import {
  useListOrders, useListAllOrders, useUpdateOrderStatus,
  getListOrdersQueryKey, getListAllOrdersQueryKey, OrderStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Clock, CheckCircle2, ShoppingBag, MapPin } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { getLocalOrders, updateLocalOrderStatus } from "@/lib/local-orders";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
  preparing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200",
  ready: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200",
};

const STATUS_STEPS = ["pending", "confirmed", "preparing", "ready", "delivered"];

function OrderProgress({ status }: { status: string }) {
  if (status === "cancelled") return null;
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-4 mb-1">
      {STATUS_STEPS.map((s, idx) => (
        <div key={s} className="flex items-center flex-1">
          <div className={`h-2 w-full rounded-full transition-all duration-500 ${idx <= currentIdx ? "bg-primary" : "bg-border"}`} />
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const isCafe = user?.role === "cafe";
  const queryClient = useQueryClient();

  const { data: userOrders, isLoading: isUserOrdersLoading } = useListOrders({
    query: { enabled: !isCafe }
  });
  const { data: cafeOrders, isLoading: isCafeOrdersLoading } = useListAllOrders({
    query: { enabled: isCafe }
  });

  const updateStatus = useUpdateOrderStatus();

  const orders = isCafe ? cafeOrders : userOrders;
  const orderList = Array.isArray(orders) && orders.length ? orders : getLocalOrders();
  const isLoading = isCafe ? isCafeOrdersLoading : isUserOrdersLoading;

  const handleStatusUpdate = (orderId: number, status: OrderStatus, successMsg: string) => {
    if (updateLocalOrderStatus(orderId, status)) {
      toast.success(successMsg);
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      return;
    }
    updateStatus.mutate(
      { id: orderId, data: { status } },
      {
        onSuccess: () => {
          toast.success(successMsg);
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
        },
        onError: () => {
          if (updateLocalOrderStatus(orderId, status)) {
            toast.success(successMsg);
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          } else {
            toast.error("Failed to update order status");
          }
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          <Package size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight text-foreground">
            {isCafe ? "Incoming Orders" : "My Orders"}
          </h1>
          <p className="text-muted-foreground">
            {isCafe ? "Manage and fulfill customer orders" : "Track your recent food orders"}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/4 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : orderList.length ? (
          orderList.map((order) => (
            <Card key={order.id} className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-secondary/30 pb-4 border-b border-border/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Order #{order.id}
                      <Badge variant="outline" className={`${STATUS_COLORS[order.status]} capitalize`}>
                        {order.status}
                      </Badge>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <Clock size={14} />
                      {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-primary">${order.total.toFixed(2)}</div>
                    {isCafe && order.userName && (
                      <div className="text-sm text-muted-foreground">Customer: {order.userName}</div>
                    )}
                  </div>
                </div>
                {!isCafe && <OrderProgress status={order.status} />}
              </CardHeader>

              <CardContent className="pt-6">
                <div className="space-y-4">
                  {(Array.isArray(order.items) ? order.items : []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {item.foodItemImageUrl ? (
                          <img src={item.foodItemImageUrl} alt={item.foodItemName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShoppingBag size={20} className="text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.foodItemName}</h4>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                {order.deliveryAddress && (
                  <div className="mt-6 p-3 bg-muted/50 rounded-lg flex gap-3 text-sm">
                    <MapPin size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium mb-1">Delivery Address</div>
                      <div className="text-muted-foreground whitespace-pre-line">{order.deliveryAddress}</div>
                      {order.notes && (
                        <div className="mt-2 text-xs italic bg-background p-2 rounded border border-border">
                          {order.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="bg-secondary/10 border-t border-border/50 pt-4 flex flex-wrap gap-2 justify-end">
                {!isCafe && order.status === "pending" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/30">
                        Cancel Order
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Order #{order.id} will be cancelled. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Order</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleStatusUpdate(order.id, "cancelled", "Order cancelled successfully")}
                        >
                          Yes, Cancel
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {isCafe && order.status !== "delivered" && order.status !== "cancelled" && (
                  <>
                    {order.status === "pending" && (
                      <>
                        <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleStatusUpdate(order.id, "cancelled", "Order rejected")}>
                          Reject
                        </Button>
                        <Button onClick={() => handleStatusUpdate(order.id, "confirmed", "Order accepted!")}>
                          Accept Order
                        </Button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <Button onClick={() => handleStatusUpdate(order.id, "preparing", "Marked as preparing")}>
                        Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button onClick={() => handleStatusUpdate(order.id, "ready", "Order is ready!")}>
                        Mark as Ready
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button onClick={() => handleStatusUpdate(order.id, "delivered", "Order delivered!")}>
                        Mark Delivered
                      </Button>
                    )}
                  </>
                )}

                {order.status === "delivered" && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle2 size={16} /> Delivered successfully
                  </div>
                )}
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="p-6 bg-secondary rounded-full mb-6 text-muted-foreground">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-2xl font-bold font-serif mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              {isCafe ? "You don't have any incoming orders right now." : "You haven't placed any food orders yet."}
            </p>
            {!isCafe && (
              <Button asChild>
                <a href="/menu">Browse Menu</a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
