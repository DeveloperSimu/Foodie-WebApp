import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useGetFoodItem, useCreateOrder } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  ShoppingBag,
  ChefHat,
  User,
  Phone,
  Home,
  Package,
} from "lucide-react";
import { DEMO_FOOD_ITEMS, getFoodImage } from "@/lib/demo-foods";
import { getLocalFoods } from "@/lib/local-foods";
import { createLocalOrder } from "@/lib/local-orders";

type Step = "summary" | "address" | "payment" | "confirm";

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "summary", label: "Order Summary", icon: ShoppingBag },
  { id: "address", label: "Delivery Details", icon: MapPin },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "confirm", label: "Confirm", icon: CheckCircle2 },
];

type PaymentMethod = "cod" | "card" | "upi";

interface DeliveryForm {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives", icon: Banknote },
  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay accepted", icon: CreditCard },
  { id: "upi", label: "UPI / Wallet", desc: "GPay, PhonePe, Paytm", icon: Smartphone },
];

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("summary");
  const [quantity, setQuantity] = useState(1);
  const [foodId, setFoodId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [delivery, setDelivery] = useState<DeliveryForm>({
    fullName: user?.name || "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });
  const [errors, setErrors] = useState<Partial<DeliveryForm>>({});
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");

  const createOrder = useCreateOrder();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("foodId") || "", 10);
    const qty = parseInt(params.get("qty") || "1", 10);
    if (id) { setFoodId(id); setQuantity(qty || 1); }
    if (user?.name) setDelivery((prev) => ({ ...prev, fullName: user.name }));
  }, [user?.name]);

  const { data: food, isLoading } = useGetFoodItem(foodId!, {
    query: { enabled: !!foodId },
  });
  const selectedFood = food ?? getLocalFoods().find((item) => item.id === foodId) ?? DEMO_FOOD_ITEMS.find((item) => item.id === foodId);

  if (!user || user.role !== "user") {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
        <p className="mb-6 text-muted-foreground">Please log in as a regular user to place an order.</p>
        <Button asChild><Link href="/login">Log in</Link></Button>
      </div>
    );
  }

  if (isLoading && !selectedFood) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  if (!selectedFood) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Food item not found</h2>
        <Button asChild><Link href="/menu">Back to Menu</Link></Button>
      </div>
    );
  }

  const subtotal = selectedFood.price * quantity;
  const deliveryFee = subtotal > 30 ? 0 : 2.99;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax;

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  const validateAddress = () => {
    const e: Partial<DeliveryForm> = {};
    if (!delivery.fullName.trim()) e.fullName = "Full name is required";
    if (!delivery.phone.trim() || !/^\d{10}$/.test(delivery.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid 10-digit phone number";
    if (!delivery.street.trim()) e.street = "Street address is required";
    if (!delivery.city.trim()) e.city = "City is required";
    if (!delivery.state.trim()) e.state = "State is required";
    if (!delivery.pincode.trim() || !/^\d{6}$/.test(delivery.pincode))
      e.pincode = "Enter a valid 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === "address" && !validateAddress()) return;
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };

  const handleBack = () => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
    else setLocation(`/food/${foodId}`);
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === "card" && (!/^\d{16}$/.test(cardNumber.replace(/\s/g, "")) || !/^\d{2}\/\d{2}$/.test(cardExpiry) || !/^\d{3,4}$/.test(cardCvv))) {
      toast.error("Enter valid card number, expiry, and CVV");
      return;
    }
    if (paymentMethod === "upi" && !/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) {
      toast.error("Enter a valid UPI ID");
      return;
    }
    const addressString = `${delivery.fullName}, ${delivery.phone}\n${delivery.street}${delivery.landmark ? ", " + delivery.landmark : ""}\n${delivery.city}, ${delivery.state} - ${delivery.pincode}`;
    const notes = `Payment: ${PAYMENT_OPTIONS.find((p) => p.id === paymentMethod)?.label}`;

    createOrder.mutate(
      {
        data: {
          items: [{ foodItemId: foodId!, quantity }],
          deliveryAddress: addressString,
          notes,
        },
      },
      {
        onSuccess: (order) => {
          toast.success("Order placed successfully! 🎉");
          setLocation("/orders");
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "";
          if (message.includes("HTTP 500")) {
            createLocalOrder(selectedFood, quantity, addressString, notes);
            toast.success("Order placed successfully! 🎉");
            setLocation("/orders");
            return;
          }
          toast.error("Failed to place order. Please try again.");
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" onClick={handleBack} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> {step === "summary" ? "Back to item" : "Back"}
      </Button>

      <h1 className="text-3xl font-bold font-serif tracking-tight mb-8">Checkout</h1>

      {/* Step Indicator */}
      <div className="flex items-center mb-10 overflow-x-auto pb-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone = idx < currentStepIdx;
          return (
            <div key={s.id} className="flex items-center flex-shrink-0">
              <div className={`flex flex-col items-center gap-1.5 ${isActive ? "text-primary" : isDone ? "text-primary/70" : "text-muted-foreground"}`}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20" : isDone ? "border-primary/50 bg-primary/10" : "border-border bg-muted"}`}>
                  {isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <span className={`text-xs font-medium hidden sm:block whitespace-nowrap ${isActive ? "text-primary" : ""}`}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 w-10 sm:w-16 mx-2 rounded-full ${isDone ? "bg-primary/50" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Order Summary */}
          {step === "summary" && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShoppingBag size={20} className="text-primary" /> Your Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-5 p-4 bg-secondary/30 rounded-xl">
                  <div className="h-24 w-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {getFoodImage(selectedFood) ? (
                      <img src={getFoodImage(selectedFood)} alt={selectedFood.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ChefHat size={32} className="text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight mb-1">{selectedFood.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{selectedFood.description}</p>
                    <Badge variant="secondary">{selectedFood.category}</Badge>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-xl text-primary">${selectedFood.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">per item</p>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">Quantity</Label>
                  <div className="flex items-center border border-border rounded-full w-fit p-1 bg-background">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                      <span className="text-lg font-bold">−</span>
                    </Button>
                    <span className="w-14 text-center font-bold text-lg">{quantity}</span>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setQuantity(quantity + 1)}>
                      <span className="text-lg font-bold">+</span>
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({quantity} item{quantity > 1 ? "s" : ""})</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery fee</span>
                    <span className={deliveryFee === 0 ? "text-green-600 font-medium" : "font-medium"}>
                      {deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes (5%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  {deliveryFee === 0 && (
                    <p className="text-xs text-green-600 font-medium">🎉 Free delivery on orders above $30!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Delivery Address */}
          {step === "address" && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MapPin size={20} className="text-primary" /> Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2"><User size={14} /> Full Name *</Label>
                    <Input id="fullName" placeholder="John Doe" value={delivery.fullName} onChange={(e) => setDelivery((p) => ({ ...p, fullName: e.target.value }))} className={errors.fullName ? "border-destructive" : ""} />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2"><Phone size={14} /> Phone Number *</Label>
                    <Input id="phone" placeholder="9876543210" value={delivery.phone} onChange={(e) => setDelivery((p) => ({ ...p, phone: e.target.value }))} className={errors.phone ? "border-destructive" : ""} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="street" className="flex items-center gap-2"><Home size={14} /> Street Address *</Label>
                    <Input id="street" placeholder="123 Main Street, Apartment 4B" value={delivery.street} onChange={(e) => setDelivery((p) => ({ ...p, street: e.target.value }))} className={errors.street ? "border-destructive" : ""} />
                    {errors.street && <p className="text-xs text-destructive">{errors.street}</p>}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="landmark">Landmark <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input id="landmark" placeholder="Near City Mall" value={delivery.landmark} onChange={(e) => setDelivery((p) => ({ ...p, landmark: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" placeholder="Mumbai" value={delivery.city} onChange={(e) => setDelivery((p) => ({ ...p, city: e.target.value }))} className={errors.city ? "border-destructive" : ""} />
                    {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input id="state" placeholder="Maharashtra" value={delivery.state} onChange={(e) => setDelivery((p) => ({ ...p, state: e.target.value }))} className={errors.state ? "border-destructive" : ""} />
                    {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input id="pincode" placeholder="400001" maxLength={6} value={delivery.pincode} onChange={(e) => setDelivery((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "") }))} className={errors.pincode ? "border-destructive" : ""} />
                    {errors.pincode && <p className="text-xs text-destructive">{errors.pincode}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment */}
          {step === "payment" && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CreditCard size={20} className="text-primary" /> Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {PAYMENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = paymentMethod === opt.id;
                  return (
                    <div key={opt.id} onClick={() => setPaymentMethod(opt.id)} className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-secondary/30"}`}>
                      <div className={`p-3 rounded-xl ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${selected ? "text-primary" : ""}`}>{opt.label}</p>
                        <p className="text-sm text-muted-foreground">{opt.desc}</p>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? "border-primary" : "border-muted-foreground/40"}`}>
                        {selected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                  );
                })}

                {paymentMethod === "card" && (
                  <div className="mt-6 p-5 bg-secondary/30 rounded-xl space-y-4 border border-border">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Card Details (Demo)</p>
                    <Input placeholder="Card Number: 1234 5678 9012 3456" value={cardNumber} maxLength={19} onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, ""))} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="MM/YY" value={cardExpiry} maxLength={5} onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d/]/g, ""))} />
                      <Input placeholder="CVV" value={cardCvv} maxLength={4} type="password" onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))} />
                    </div>
                    <p className="text-xs text-muted-foreground">This is a demo app — no real payment is processed.</p>
                  </div>
                )}
                {paymentMethod === "upi" && (
                  <div className="mt-6 p-5 bg-secondary/30 rounded-xl border border-border">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">UPI ID (Demo)</p>
                    <Input placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value.trim())} />
                    <p className="text-xs text-muted-foreground mt-2">This is a demo app — no real payment is processed.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmation */}
          {step === "confirm" && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle2 size={20} className="text-primary" /> Review & Confirm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Order Item</h3>
                  <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
                    <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {getFoodImage(selectedFood) ? (
                        <img src={getFoodImage(selectedFood)} alt={selectedFood.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><ChefHat size={20} className="text-muted-foreground/30" /></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{selectedFood.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
                    </div>
                    <p className="font-bold text-primary">${subtotal.toFixed(2)}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Delivery Address</h3>
                  <div className="flex gap-3 p-4 bg-secondary/30 rounded-xl">
                    <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold">{delivery.fullName}</p>
                      <p className="text-muted-foreground">{delivery.phone}</p>
                      <p className="text-muted-foreground">{delivery.street}{delivery.landmark ? `, ${delivery.landmark}` : ""}</p>
                      <p className="text-muted-foreground">{delivery.city}, {delivery.state} - {delivery.pincode}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Payment Method</h3>
                  <div className="flex gap-3 p-4 bg-secondary/30 rounded-xl items-center">
                    {(() => { const opt = PAYMENT_OPTIONS.find((p) => p.id === paymentMethod)!; const Icon = opt.icon; return (<><Icon size={20} className="text-primary" /><span className="font-medium">{opt.label}</span></>); })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Order Summary */}
        <div className="lg:col-span-1">
          <Card className="border-border/50 shadow-sm sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package size={16} className="text-primary" /> Order Total
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {getFoodImage(selectedFood) ? (
                    <img src={getFoodImage(selectedFood)} alt={selectedFood.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><ChefHat size={16} className="text-muted-foreground/30" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{selectedFood.name}</p>
                  <p className="text-xs text-muted-foreground">× {quantity}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className={deliveryFee === 0 ? "text-green-600" : ""}>{deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
              <div className="pt-2">
                {step !== "confirm" ? (
                  <Button className="w-full h-12 rounded-xl font-semibold" onClick={handleNext}>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className="w-full h-12 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    onClick={handlePlaceOrder}
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? (
                      <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing...</span>
                    ) : (
                      <span className="flex items-center gap-2"><CheckCircle2 size={18} /> Place Order</span>
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs text-center text-muted-foreground">Estimated delivery: 20–35 minutes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
