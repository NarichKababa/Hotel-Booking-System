import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Users, Wifi, Car, Coffee, Dumbbell } from "lucide-react";

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

interface HotelCardProps {
  hotel: Hotel;
  onViewRooms: (hotel: Hotel) => void;
}

const getAmenityIcon = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case 'wifi':
      return <Wifi className="h-4 w-4" />;
    case 'parking':
      return <Car className="h-4 w-4" />;
    case 'restaurant':
      return <Coffee className="h-4 w-4" />;
    case 'gym':
      return <Dumbbell className="h-4 w-4" />;
    default:
      return null;
  }
};

const HotelCard = ({ hotel, onViewRooms }: HotelCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={hotel.image_url}
          alt={hotel.name}
          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4">
          <Badge className="bg-white/90 text-gray-900 hover:bg-white">
            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
            {hotel.rating}
          </Badge>
        </div>
      </div>
      
      <CardHeader>
        <CardTitle className="text-xl">{hotel.name}</CardTitle>
        <div className="flex items-center space-x-1 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{hotel.city}, {hotel.country}</span>
        </div>
        <CardDescription className="line-clamp-2">
          {hotel.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {hotel.amenities?.slice(0, 4).map((amenity, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {getAmenityIcon(amenity)}
              <span className="ml-1">{amenity}</span>
            </Badge>
          ))}
          {hotel.amenities?.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{hotel.amenities.length - 4} more
            </Badge>
          )}
        </div>
        
        <Button 
          onClick={() => onViewRooms(hotel)}
          className="w-full"
        >
          View Rooms
        </Button>
      </CardContent>
    </Card>
  );
};

export default HotelCard;