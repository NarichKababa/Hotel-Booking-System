-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hotels table
CREATE TABLE public.hotels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  amenities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  price_per_night DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  amenities TEXT[],
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Hotels policies (public read, admin write)
CREATE POLICY "Anyone can view hotels" ON public.hotels
  FOR SELECT USING (true);

-- Rooms policies (public read, admin write)
CREATE POLICY "Anyone can view rooms" ON public.rooms
  FOR SELECT USING (true);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample hotels and rooms data
INSERT INTO public.hotels (name, description, address, city, country, image_url, rating, amenities) VALUES
('Grand Plaza Hotel', 'Luxury hotel in the heart of the city with world-class amenities and service.', '123 Main Street', 'New York', 'USA', 'https://images.unsplash.com/photo-1566073771259-6a8506099945', 4.8, ARRAY['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Concierge']),
('Seaside Resort', 'Beautiful beachfront resort with stunning ocean views and private beach access.', '456 Beach Road', 'Miami', 'USA', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9', 4.6, ARRAY['WiFi', 'Beach Access', 'Pool', 'Restaurant', 'Bar', 'Water Sports']),
('Mountain Lodge', 'Cozy mountain retreat surrounded by nature, perfect for outdoor enthusiasts.', '789 Mountain View Drive', 'Aspen', 'USA', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb', 4.5, ARRAY['WiFi', 'Fireplace', 'Hiking Trails', 'Restaurant', 'Spa']);

-- Get hotel IDs for room insertion
DO $$
DECLARE
    grand_plaza_id UUID;
    seaside_id UUID;
    mountain_id UUID;
BEGIN
    SELECT id INTO grand_plaza_id FROM public.hotels WHERE name = 'Grand Plaza Hotel';
    SELECT id INTO seaside_id FROM public.hotels WHERE name = 'Seaside Resort';
    SELECT id INTO mountain_id FROM public.hotels WHERE name = 'Mountain Lodge';

    -- Insert rooms for Grand Plaza Hotel
    INSERT INTO public.rooms (hotel_id, name, description, type, capacity, price_per_night, image_url, amenities) VALUES
    (grand_plaza_id, 'Deluxe King Room', 'Spacious room with king bed and city views', 'Deluxe', 2, 299.99, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304', ARRAY['King Bed', 'City View', 'WiFi', 'Mini Bar']),
    (grand_plaza_id, 'Executive Suite', 'Luxurious suite with separate living area', 'Suite', 4, 599.99, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39', ARRAY['King Bed', 'Living Area', 'WiFi', 'Mini Bar', 'Balcony']),
    (grand_plaza_id, 'Standard Double', 'Comfortable room with two double beds', 'Standard', 4, 199.99, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7', ARRAY['Double Beds', 'WiFi', 'TV']);

    -- Insert rooms for Seaside Resort
    INSERT INTO public.rooms (hotel_id, name, description, type, capacity, price_per_night, image_url, amenities) VALUES
    (seaside_id, 'Ocean View Suite', 'Stunning suite with panoramic ocean views', 'Suite', 2, 449.99, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b', ARRAY['Ocean View', 'King Bed', 'Balcony', 'WiFi']),
    (seaside_id, 'Beachfront Villa', 'Private villa steps from the beach', 'Villa', 6, 899.99, 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd', ARRAY['Beach Access', 'Multiple Bedrooms', 'Kitchen', 'WiFi']),
    (seaside_id, 'Standard Beach Room', 'Comfortable room with beach access', 'Standard', 2, 249.99, 'https://images.unsplash.com/photo-1540518614846-7eded433c457', ARRAY['Beach Access', 'Queen Bed', 'WiFi']);

    -- Insert rooms for Mountain Lodge
    INSERT INTO public.rooms (hotel_id, name, description, type, capacity, price_per_night, image_url, amenities) VALUES
    (mountain_id, 'Mountain View Cabin', 'Rustic cabin with stunning mountain views', 'Cabin', 4, 189.99, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000', ARRAY['Mountain View', 'Fireplace', 'Kitchen', 'WiFi']),
    (mountain_id, 'Alpine Suite', 'Luxurious suite with mountain panorama', 'Suite', 2, 349.99, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2', ARRAY['Mountain View', 'King Bed', 'Fireplace', 'Balcony']),
    (mountain_id, 'Cozy Double Room', 'Warm and comfortable mountain room', 'Standard', 2, 129.99, 'https://images.unsplash.com/photo-1484154218962-a197022b5858', ARRAY['Mountain View', 'Double Bed', 'Fireplace']);
END $$;