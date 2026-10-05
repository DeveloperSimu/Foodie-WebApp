import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, ChefHat, Lightbulb, LogOut, ShieldCheck, Trash2, Video, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_FOOD_ITEMS, DEMO_SHORTS } from "@/lib/demo-foods";
import { DEMO_IDEAS } from "@/lib/demo-ideas";
import { getLocalFoods, createLocalFood, deleteLocalFood, updateLocalFood } from "@/lib/local-foods";
import { getLocalShorts, deleteLocalShort, updateLocalShort } from "@/lib/local-shorts";
import { createLocalIdea, deleteLocalIdea, getLocalIdeas, updateLocalIdea } from "@/lib/local-ideas";
import { deleteLocalOrder, getLocalOrders, updateLocalOrderStatus } from "@/lib/local-orders";
import { createLocalReview, deleteLocalReview, getLocalReviews, updateLocalReview } from "@/lib/local-reviews";
import { clearAdminSession, getAdminToken, logoutAdmin, verifyAdminSession } from "@/lib/admin-auth";
import { getLocalUsers, isLocalUserDisabled, setLocalUserDisabled } from "@/lib/auth";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [, refresh] = useState(0);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const localFoods = getLocalFoods();
  const localShorts = getLocalShorts();
  const localIdeas = getLocalIdeas();
  const localReviews = getLocalReviews();
  const localUsers = getLocalUsers();
  const [form, setForm] = useState<"food" | "short" | "idea" | "comment" | null>(null);
  const [editTarget, setEditTarget] = useState<{ type: "food" | "short" | "idea" | "comment"; id: number } | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("Veg");
  const [cafeName, setCafeName] = useState("");
  const [price, setPrice] = useState("9.99");
  const [rating, setRating] = useState("0");
  const [reviewCount, setReviewCount] = useState("0");
  const [orderRefresh, setOrderRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    verifyAdminSession().then((authorized) => {
      if (!active) return;
      setIsAuthorized(authorized);
      setIsCheckingAdmin(false);
      if (!authorized) setLocation("/admin/login");
    }).catch((error: unknown) => {
      if (!active) return;
      toast.error(error instanceof Error ? error.message : "Could not verify admin access.");
      clearAdminSession();
      setIsCheckingAdmin(false);
      setLocation("/admin/login");
    });
    return () => {
      active = false;
    };
  }, [setLocation]);

  if (isCheckingAdmin) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Verifying admin access...</div>;
  }
  if (!isAuthorized) return null;

  const remove = (type: "food" | "short" | "idea", id: number, title: string) => {
    if (!confirm(`Delete "${title}" permanently?`)) return;
    const deleted = type === "food" ? deleteLocalFood(id) : type === "short" ? deleteLocalShort(id) : deleteLocalIdea(id);
    if (deleted) {
      toast.success("Content deleted");
      refresh((value) => value + 1);
    } else {
      toast.error("Only locally created content can be deleted here.");
    }
  };

  const leave = () => {
    const token = getAdminToken();
    logoutAdmin().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Could not end the admin session.");
    });
    setLocation("/admin/login");
  };

  const startAdd = (type: "food" | "short" | "idea" | "comment") => {
    setEditTarget(null);
    setForm(type);
    setTitle("");
    setContent("");
    setUrl("");
    setTags("");
    setCategory("Veg");
    setCafeName("");
    setPrice("9.99");
    setRating("0");
    setReviewCount("0");
  };

  const startEdit = (type: "food" | "short" | "idea" | "comment", id: number) => {
    const item = type === "food" ? localFoods.find((value) => value.id === id)
      : type === "short" ? localShorts.find((value) => value.id === id)
      : type === "idea" ? localIdeas.find((value) => value.id === id)
      : localReviews.find((value) => value.id === id);
    if (!item) return;
    setEditTarget({ type, id });
    setForm(type);
    if (type === "food") {
      setTitle(item.name); setContent(item.description); setUrl(item.imageUrl || "");
      setCategory(item.category); setCafeName(item.cafeName || ""); setPrice(String(item.price));
      setRating(String(item.rating)); setReviewCount(String(item.reviewCount));
    } else if (type === "short") {
      setTitle(item.title); setContent(item.description || ""); setUrl(item.videoUrl);
    } else if (type === "idea") {
      setTitle(item.title); setContent(item.content); setUrl(item.imageUrl || ""); setTags(item.tags.join(", "));
    } else {
      setUrl(String(item.ideaId)); setContent(item.comment);
    }
  };

  const createContent = () => {
    if (form !== "comment" && !title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (editTarget) {
      let updated = false;
      if (editTarget.type === "food") updated = updateLocalFood(editTarget.id, {
        name: title.trim(), description: content.trim(), imageUrl: url.trim() || null, category,
        cafeName: cafeName.trim() || null, price: Number(price), rating: Number(rating), reviewCount: Number(reviewCount),
      });
      else if (editTarget.type === "short") updated = updateLocalShort(editTarget.id, { title: title.trim(), description: content.trim() || null, videoUrl: url.trim() });
      else if (editTarget.type === "idea") updated = updateLocalIdea(editTarget.id, { title: title.trim(), content: content.trim(), imageUrl: url.trim() || null, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) });
      else updated = updateLocalReview(editTarget.id, { ideaId: Number(url), comment: content.trim() });
      if (!updated) {
        toast.error("Could not update this content");
        return;
      }
    } else if (form === "food") {
      if (!cafeName.trim()) {
        toast.error("Cafe name is required");
        return;
      }
      if (!(Number(price) > 0) || Number(rating) < 0 || Number(rating) > 5 || Number(reviewCount) < 0) {
        toast.error("Enter a valid price, rating (0-5), and review count");
        return;
      }
      const food = createLocalFood({
        name: title.trim(),
        description: content.trim() || "Added by admin",
        price: Math.max(0, Number(price) || 0),
        category,
        available: true,
        imageUrl: url || undefined,
      }, 0, cafeName.trim() || "Foodie Admin");
      updateLocalFood(food.id, {
        rating: Math.min(5, Math.max(0, Number(rating) || 0)),
        reviewCount: Math.max(0, Number(reviewCount) || 0),
      });
    } else if (form === "short") {
      if (!url.trim()) { toast.error("Video URL is required"); return; }
      createLocalShort(title.trim(), content.trim(), url.trim(), undefined, 0, "Foodie Admin", "admin");
    } else if (form === "idea") {
      if (!content.trim()) {
        toast.error("Idea content is required");
        return;
      }
      createLocalIdea(
        title.trim(),
        content.trim(),
        url.trim() || undefined,
        tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        0,
        "Foodie Admin",
        "admin",
      );
    } else if (form === "comment") {
      createLocalReview(Number(url) || 0, 0, "Foodie Admin", content.trim(), 5);
    }
    toast.success(editTarget ? "Content updated" : "Content added");
    setTitle(""); setContent(""); setUrl(""); setTags(""); setCategory("Veg"); setCafeName(""); setPrice("9.99"); setRating("0"); setReviewCount("0"); setForm(null); setEditTarget(null); refresh((value) => value + 1);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck size={16} /> Superuser Access</p>
          <h1 className="text-4xl font-bold font-serif">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor and control the complete Foodie platform.</p>
        </div>
        <Button variant="outline" onClick={leave}><LogOut className="mr-2 h-4 w-4" /> Admin Logout</Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Dishes", DEMO_FOOD_ITEMS.length + localFoods.length, ChefHat],
          ["Shorts", DEMO_SHORTS.length + localShorts.length, Video],
          ["Ideas", DEMO_IDEAS.length + localIdeas.length, Lightbulb],
          ["Local Orders", getLocalOrders().length, BarChart3],
        ].map(([label, value, Icon]) => (
          <Card key={String(label)}><CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon size={24} /></div>
            <div><p className="text-2xl font-bold">{String(value)}</p><p className="text-sm text-muted-foreground">{String(label)}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Platform Management</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => startAdd("food")}><Plus className="mr-1 h-4 w-4" /> Add Dish</Button>
          <Button variant="outline" onClick={() => startAdd("short")}><Plus className="mr-1 h-4 w-4" /> Add Short</Button>
          <Button variant="outline" onClick={() => startAdd("idea")}><Plus className="mr-1 h-4 w-4" /> Add Idea</Button>
          <Button variant="outline" onClick={() => startAdd("comment")}><Plus className="mr-1 h-4 w-4" /> Add Comment</Button>
          <Button asChild variant="outline"><Link href="/menu">View Menu</Link></Button>
          <Button asChild variant="outline"><Link href="/orders">Manage Orders</Link></Button>
        </CardContent></Card>
        <Card className="md:col-span-2"><CardHeader><CardTitle>Admin authority</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">
          Server content is protected by API ownership rules. Local content created in this browser can be removed below; existing app pages remain unchanged.
        </CardContent></Card>
      </div>

      {form && (
        <Card className="mb-8">
          <CardHeader><CardTitle>{editTarget ? "Edit" : "Add"} {form === "food" ? "Dish" : form === "short" ? "Short" : form === "idea" ? "Idea" : "Comment"}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {form === "comment" ? <Input placeholder="Idea ID" value={url} onChange={(event) => setUrl(event.target.value)} /> : <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />}
            {form === "food" && <label className="grid gap-1 text-sm font-medium">Category<select className="h-10 rounded-md border bg-background px-3 text-sm font-normal" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Dish category">
              {["Veg", "Non-Veg", "Chinese", "Italian", "Fast Food", "Desserts", "Beverages"].map((option) => <option key={option} value={option}>{option}</option>)}
            </select></label>}
            {form === "food" && <label className="grid gap-1 text-sm font-medium">Cafe name<Input placeholder="Cafe name" value={cafeName} onChange={(event) => setCafeName(event.target.value)} /></label>}
            {form === "food" && <label className="grid gap-1 text-sm font-medium">Price ($)<Input type="number" min="0" step="0.01" placeholder="Price" value={price} onChange={(event) => setPrice(event.target.value)} /></label>}
            {form === "food" && <label className="grid gap-1 text-sm font-medium">Rating (0-5)<Input type="number" min="0" max="5" step="0.1" placeholder="Rating (0-5)" value={rating} onChange={(event) => setRating(event.target.value)} /></label>}
            {form === "food" && <label className="grid gap-1 text-sm font-medium">Review count<Input type="number" min="0" step="1" placeholder="Review count" value={reviewCount} onChange={(event) => setReviewCount(event.target.value)} /></label>}
            {form !== "comment" && <Input placeholder={form === "short" ? "Video URL" : form === "idea" ? "Cover Image URL (optional)" : "Image URL (optional)"} value={url} onChange={(event) => setUrl(event.target.value)} />}
            {form === "idea" && <Input placeholder="Tags (optional): recipe, vegan, quick" value={tags} onChange={(event) => setTags(event.target.value)} />}
            <Textarea placeholder={form === "comment" ? "Comment text" : form === "idea" ? "Share your recipe, steps, or thoughts here..." : "Description/content"} value={content} onChange={(event) => setContent(event.target.value)} />
            <div className="flex gap-2 sm:col-span-2"><Button onClick={createContent}>{editTarget ? "Save Changes" : "Save"}</Button><Button variant="ghost" onClick={() => { setForm(null); setEditTarget(null); }}>Cancel</Button></div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader><CardTitle>Local Orders</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {getLocalOrders().length === 0 && <p className="text-sm text-muted-foreground">No local orders.</p>}
          {getLocalOrders().map((order) => (
            <div key={`${order.id}-${orderRefresh}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Order #{order.id}</p>
                <p className="text-xs text-muted-foreground">${order.total.toFixed(2)} · {order.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <select className="h-9 rounded-md border bg-background px-2 text-sm" value={order.status} onChange={(event) => {
                  updateLocalOrderStatus(order.id, event.target.value as typeof order.status);
                  setOrderRefresh((value) => value + 1);
                }} aria-label={`Update order ${order.id} status`}>
                  {["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"].map((status) => <option key={status}>{status}</option>)}
                </select>
                <Button variant="destructive" size="icon" aria-label={`Delete order ${order.id}`} onClick={() => {
                  if (confirm(`Delete order #${order.id}?`)) {
                    deleteLocalOrder(order.id);
                    setOrderRefresh((value) => value + 1);
                  }
                }}><Trash2 size={15} /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Registered Local Accounts</CardTitle>
          <p className="text-sm text-muted-foreground">Passwords are never displayed. You can report and disable local accounts here.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {localUsers.length === 0 && <p className="text-sm text-muted-foreground">No local accounts registered.</p>}
          {localUsers.map((account) => {
            const disabled = isLocalUserDisabled(account.id);
            return (
              <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-muted-foreground">{account.email} · {account.role}</p>
                </div>
                <Button variant={disabled ? "outline" : "destructive"} onClick={() => {
                  setLocalUserDisabled(account.id, !disabled);
                  refresh((value) => value + 1);
                  toast.success(disabled ? "Account restored" : "Account reported and disabled");
                }}>
                  {disabled ? "Restore Account" : "Report & Disable"}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {[
          ["Local Dishes", localFoods.map((item) => ({ id: item.id, title: item.name, type: "food" as const }))],
          ["Local Shorts", localShorts.map((item) => ({ id: item.id, title: item.title, type: "short" as const }))],
          ["Local Ideas", localIdeas.map((item) => ({ id: item.id, title: item.title, type: "idea" as const }))],
        ].map(([heading, items]) => (
          <Card key={String(heading)}><CardHeader><CardTitle>{String(heading)}</CardTitle></CardHeader><CardContent className="space-y-3">
            {(items as Array<{ id: number; title: string; type: "food" | "short" | "idea" }>).length === 0 && <p className="text-sm text-muted-foreground">No local content.</p>}
            {(items as Array<{ id: number; title: string; type: "food" | "short" | "idea" }>).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3" onDoubleClick={() => startEdit(item.type, item.id)}>
                <span className="truncate text-sm font-medium">{item.title}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => startEdit(item.type, item.id)}>Edit</Button>
                  <Button variant="destructive" size="icon" aria-label={`Delete ${item.title}`} onClick={() => remove(item.type, item.id, item.title)}><Trash2 size={15} /></Button>
                </div>
              </div>
            ))}
          </CardContent></Card>
        ))}
        <Card><CardHeader><CardTitle>Local Comments</CardTitle></CardHeader><CardContent className="space-y-3">
          {localReviews.length === 0 && <p className="text-sm text-muted-foreground">No local comments.</p>}
          {localReviews.map((review) => <div key={review.id} className="flex items-center justify-between gap-2 rounded-lg border p-3"><span className="truncate text-sm">{review.comment}</span><div className="flex gap-1"><Button variant="outline" size="sm" onClick={() => startEdit("comment", review.id)}>Edit</Button><Button variant="destructive" size="icon" onClick={() => { if (confirm("Delete this comment?")) { deleteLocalReview(review.id); refresh((value) => value + 1); } }}><Trash2 size={15} /></Button></div></div>)}
        </CardContent></Card>
      </div>
    </div>
  );
}
