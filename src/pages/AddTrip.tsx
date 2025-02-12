
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AddTrip = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-display text-gray-900">Add New Trip</h1>
            <Link to="/">
              <Button variant="outline">Back to Trips</Button>
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600">Add Trip form coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTrip;
