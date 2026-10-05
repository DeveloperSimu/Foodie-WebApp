import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useListFoodItems, useCreateFoodItem, useDeleteFoodItem, useUpdateFoodItem } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChefHat, Plus, Edit, Trash2, Store, Search } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createLocalFood, deleteLocalFood, getLocalFoods, updateLocalFood } from "@/lib/local-foods";

const CATEGORIES = ["Veg", "Non-Veg", "Chinese", "Italian", "Fast Food", "Desserts", "Beverages"];

const foodItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  category: z.string().min(1, "Please select a category"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  available: z.boolean().default(true)
});

type FoodItemFormValues = z.infer<typeof foodItemSchema>;

export default function CafeMenu() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [, refreshLocalFoods] = useState(0);

  const { data: foodItems, isLoading, refetch } = useListFoodItems({ 
    cafeId: user?.id,
    search: search || undefined
  }, {
    query: { enabled: !!user?.id }
  });
  const foodItemList = [
    ...getLocalFoods(user?.id),
    ...(Array.isArray(foodItems) ? foodItems : []),
  ].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  const createMutation = useCreateFoodItem();
  const updateMutation = useUpdateFoodItem();
  const deleteMutation = useDeleteFoodItem();

  const addForm = useForm<FoodItemFormValues>({
    resolver: zodResolver(foodItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      imageUrl: "",
      available: true
    }
  });

  const editForm = useForm<FoodItemFormValues>({
    resolver: zodResolver(foodItemSchema),
    values: editItem ? {
      name: editItem.name,
      description: editItem.description,
      price: editItem.price,
      category: editItem.category,
      imageUrl: editItem.imageUrl || "",
      available: editItem.available
    } : undefined
  });

  const onAddSubmit = (data: FoodItemFormValues) => {
    createMutation.mutate({ 
      data: {
        ...data,
        imageUrl: data.imageUrl || undefined
      } 
    }, {
      onSuccess: () => {
        toast.success("Food item added successfully");
        setIsAddOpen(false);
        addForm.reset();
        refetch();
      },
      onError: () => {
        if (!user) return;
        createLocalFood(data, user.id, user.name);
        refreshLocalFoods((version) => version + 1);
        toast.success("Food item added successfully");
        setIsAddOpen(false);
        addForm.reset();
      }
    });
  };

  const onEditSubmit = (data: FoodItemFormValues) => {
    if (!editItem) return;
    
    updateMutation.mutate({ 
      id: editItem.id,
      data: {
        ...data,
        imageUrl: data.imageUrl || undefined
      } 
    }, {
      onSuccess: () => {
        toast.success("Food item updated successfully");
        setEditItem(null);
        refreshLocalFoods((version) => version + 1);
        refetch();
      },
      onError: () => {
        if (updateLocalFood(editItem.id, data)) {
          toast.success("Food item updated successfully");
          setEditItem(null);
        } else {
          toast.error("Failed to update food item");
        }
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      if (deleteLocalFood(id)) {
        toast.success("Item deleted");
        refreshLocalFoods((version) => version + 1);
        return;
      }
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast.success("Item deleted");
          refetch();
        }
      });
    }
  };

  if (!user || user.role !== "cafe") {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Store size={64} className="mx-auto text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-bold mb-4 font-serif">Cafe Access Only</h2>
        <p className="text-muted-foreground mb-6">You must be logged in as a cafe to view this page.</p>
        <Button asChild><Link href="/">Go Home</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight text-foreground flex items-center gap-2">
            <Store className="text-primary" /> My Menu
          </h1>
          <p className="text-muted-foreground">Manage your cafe's dishes and availability</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search dishes..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Dish</DialogTitle>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Margherita Pizza" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIES.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={addForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Classic delight with 100% real mozzarella cheese" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/pizza.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="available"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Availability</FormLabel>
                          <p className="text-sm text-muted-foreground">Is this item currently available?</p>
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
                  
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Adding..." : "Add Item"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Dish</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Availability</FormLabel>
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
              
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/50">
              <Skeleton className="h-48 w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        ) : foodItemList.length ? (
          foodItemList.map((food) => (
            <Card key={food.id} className={`overflow-hidden border-border/50 ${!food.available ? 'opacity-70' : ''}`}>
              <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                {food.imageUrl ? (
                  <img src={food.imageUrl} alt={food.name} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat size={40} className="text-muted-foreground/30" />
                  </div>
                )}
                {!food.available && (
                  <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
                    OUT OF STOCK
                  </div>
                )}
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-1" title={food.name}>{food.name}</CardTitle>
                  <span className="font-bold text-primary whitespace-nowrap">${food.price.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground">{food.category}</div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">{food.description}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setEditItem(food)}
                >
                  <Edit size={14} className="mr-2" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                  onClick={() => handleDelete(food.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={14} />
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border border-dashed rounded-xl flex flex-col items-center">
            <Store size={48} className="text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">Your menu is empty</h3>
            <p className="text-muted-foreground mb-6">Start adding delicious dishes for customers to order!</p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Your First Dish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
