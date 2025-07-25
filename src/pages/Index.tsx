import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import HotelCard from "@/components/HotelCard";
import RoomCard from "@/components/RoomCard";
import BookingModal from "@/components/BookingModal";
import SearchFilters, { SearchFilters as SearchFiltersType } from "@/components/SearchFilters";
import type { User } from '@supabase/supabase-js';

interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  image_url: string;
  rating: number;
  amenities: string[];
}

interface Room {
  id: string;
  name: string;
  description: string;
  type: string;
  capacity: number;
  price_per_night: number;
  image_url: string;
  amenities: string[];
  available: boolean;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'hotels' | 'rooms'>('hotels');
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .order('rating', { ascending: false });
      
      if (error) throw error;
      setHotels(data || []);
      setFilteredHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast({
        title: "Error",
        description: "Failed to load hotels. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (hotelId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('price_per_night', { ascending: true });
      
      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: SearchFiltersType) => {
    let filtered = [...hotels];

    // Filter by destination
    if (filters.destination) {
      filtered = filtered.filter(hotel => 
        hotel.name.toLowerCase().includes(filters.destination.toLowerCase()) ||
        hotel.city.toLowerCase().includes(filters.destination.toLowerCase()) ||
        hotel.country.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    setFilteredHotels(filtered);
  };

  const handleViewRooms = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setView('rooms');
    fetchRooms(hotel.id);
  };

  const handleBookRoom = (room: Room) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make a booking.",
        variant: "destructive",
      });
      window.location.href = '/auth';
      return;
    }
    
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleBackToHotels = () => {
    setView('hotels');
    setSelectedHotel(null);
    setRooms([]);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Failed",
        description: error.message || "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading && hotels.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">BookStay</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button onClick={() => window.location.href = '/auth'}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'hotels' ? (
          <>
            {/* Search Filters */}
            <SearchFilters onSearch={handleSearch} />

            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Find Your Perfect Stay
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover amazing hotels around the world with the best prices and amenities.
                Book your next adventure with confidence.
              </p>
            </div>

            {/* Hotels Grid */}
            {filteredHotels.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hotels found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria to find more hotels.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHotels.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    onViewRooms={handleViewRooms}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Rooms View */}
            <div className="mb-6">
              <Button variant="outline" onClick={handleBackToHotels} className="mb-4">
                ← Back to Hotels
              </Button>
              {selectedHotel && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-bold mb-2">{selectedHotel.name}</h2>
                  <p className="text-muted-foreground mb-4">
                    {selectedHotel.city}, {selectedHotel.country}
                  </p>
                  <p className="text-gray-700">{selectedHotel.description}</p>
                </div>
              )}
            </div>

            {/* Rooms Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No rooms available</h3>
                <p className="text-muted-foreground">
                  This hotel currently has no available rooms.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onBookRoom={handleBookRoom}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        room={selectedRoom}
        hotel={selectedHotel}
      />
    </div>
  );
};

export default Index;