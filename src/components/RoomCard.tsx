import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Bed, Wifi, Coffee } from "lucide-react";

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

interface RoomCardProps {
  room: Room;
  onBookRoom: (room: Room) => void;
}

const getRoomIcon = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case 'wifi':
      return <Wifi className="h-3 w-3" />;
    case 'mini bar':
      return <Coffee className="h-3 w-3" />;
    case 'king bed':
    case 'queen bed':
    case 'double beds':
      return <Bed className="h-3 w-3" />;
    default:
      return null;
  }
};

const RoomCard = ({ room, onBookRoom }: RoomCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={room.image_url}
          alt={room.name}
          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <Badge variant={room.available ? "default" : "destructive"}>
            {room.available ? "Available" : "Unavailable"}
          </Badge>
        </div>
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{room.name}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {room.type}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              ${room.price_per_night}
            </div>
            <div className="text-sm text-muted-foreground">per night</div>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {room.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{room.capacity} guests</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {room.amenities?.map((amenity, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {getRoomIcon(amenity)}
              <span className="ml-1">{amenity}</span>
            </Badge>
          ))}
        </div>
        
        <Button 
          onClick={() => onBookRoom(room)}
          className="w-full"
          disabled={!room.available}
        >
          {room.available ? "Book Now" : "Unavailable"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RoomCard;