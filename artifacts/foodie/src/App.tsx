import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { AuthRequired } from "@/components/auth-required";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Menu from "@/pages/menu";
import FoodDetail from "@/pages/food-detail";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import Wishlist from "@/pages/wishlist";
import CafeMenu from "@/pages/cafe/menu";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

import ShortsFeed from "@/pages/shorts/feed";
import ShortDetail from "@/pages/shorts/detail";
import ShortNew from "@/pages/shorts/new";
import IdeasFeed from "@/pages/ideas/feed";
import IdeaDetail from "@/pages/ideas/detail";
import IdeaNew from "@/pages/ideas/new";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/menu" component={Menu} />
        <Route path="/food/:id" component={FoodDetail} />
        <Route path="/checkout"><AuthRequired><Checkout /></AuthRequired></Route>
        <Route path="/orders"><AuthRequired><Orders /></AuthRequired></Route>
        <Route path="/wishlist"><AuthRequired><Wishlist /></AuthRequired></Route>
        <Route path="/cafe/menu"><AuthRequired><CafeMenu /></AuthRequired></Route>
        <Route path="/profile"><AuthRequired><Profile /></AuthRequired></Route>
        <Route path="/shorts/new"><AuthRequired><ShortNew /></AuthRequired></Route>
        <Route path="/shorts/:id" component={ShortDetail} />
        <Route path="/shorts" component={ShortsFeed} />
        <Route path="/ideas/new"><AuthRequired><IdeaNew /></AuthRequired></Route>
        <Route path="/ideas/:id" component={IdeaDetail} />
        <Route path="/ideas" component={IdeasFeed} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
