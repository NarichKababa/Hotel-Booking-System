import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  name: string;
  price_per_night: number;
  capacity: number;
}

interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  hotel: Hotel | null;
}

const BookingModal = ({ isOpen, onClose, room, hotel }: BookingModalProps) => {
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const calculateTotalPrice = () => {
    if (!checkInDate || !checkOutDate || !room) return 0;
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    return nights * room.price_per_night;
  };

  const handleBooking = async () => {
    if (!room || !hotel || !checkInDate || !checkOutDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make a booking.",
        variant: "destructive",
      });
      window.location.href = '/auth';
      return;
    }

    if (guests > room.capacity) {
      toast({
        title: "Too Many Guests",
        description: `This room can accommodate maximum ${room.capacity} guests.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const totalPrice = calculateTotalPrice();
      
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: session.user.id,
          hotel_id: hotel.id,
          room_id: room.id,
          check_in_date: format(checkInDate, 'yyyy-MM-dd'),
          check_out_date: format(checkOutDate, 'yyyy-MM-dd'),
          guests,
          total_price: totalPrice,
          special_requests: specialRequests || null,
          status: 'confirmed'
        });

      if (error) throw error;

      toast({
        title: "Booking Confirmed!",
        description: `Your booking at ${hotel.name} has been confirmed.`,
      });

      onClose();
      // Reset form
      setCheckInDate(undefined);
      setCheckOutDate(undefined);
      setGuests(1);
      setSpecialRequests("");
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nights = checkInDate && checkOutDate 
    ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Your Stay</DialogTitle>
          <DialogDescription>
            {room && hotel && `${room.name} at ${hotel.name}, ${hotel.city}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Check-in Date */}
          <div className="space-y-2">
            <Label>Check-in Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkInDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkInDate ? format(checkInDate, "PPP") : "Select check-in date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkInDate}
                  onSelect={setCheckInDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out Date */}
          <div className="space-y-2">
            <Label>Check-out Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkOutDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkOutDate ? format(checkOutDate, "PPP") : "Select check-out date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOutDate}
                  onSelect={setCheckOutDate}
                  disabled={(date) => date <= (checkInDate || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Number of Guests */}
          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="guests"
                type="number"
                min="1"
                max={room?.capacity || 10}
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                className="pl-10"
              />
            </div>
            {room && (
              <p className="text-sm text-muted-foreground">
                Maximum {room.capacity} guests for this room
              </p>
            )}
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="requests">Special Requests (Optional)</Label>
            <Textarea
              id="requests"
              placeholder="Any special requests or preferences..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
            />
          </div>

          {/* Booking Summary */}
          {checkInDate && checkOutDate && room && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Booking Summary</h4>
              <div className="flex justify-between text-sm">
                <span>Room rate per night:</span>
                <span>${room.price_per_night}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Number of nights:</span>
                <span>{nights}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Number of guests:</span>
                <span>{guests}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Price:</span>
                <span>${calculateTotalPrice()}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleBooking} 
              disabled={loading || !checkInDate || !checkOutDate}
              className="flex-1"
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;