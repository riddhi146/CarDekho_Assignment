import json
from typing import List, Dict, Any, Optional
from models import ExtractedRequirements

class RecommendationEngine:
    def __init__(self, dataset_path: str = "car_dataset.json"):
        with open(dataset_path, 'r') as f:
            self.dataset = json.load(f)
        self.cars = self.dataset.get("cars", [])
    
    def filter_cars(self, requirements: ExtractedRequirements) -> List[Dict[str, Any]]:
        """Filter cars based on extracted requirements"""
        filtered = self.cars
        
        # Filter by body type
        if requirements.body_type:
            filtered = [car for car in filtered if car.get("body_type", "").lower() == requirements.body_type.lower()]
        
        # Filter by number of seats
        if requirements.number_of_seats:
            filtered = [car for car in filtered if car.get("number_of_seats", 0) >= requirements.number_of_seats]
        
        # Filter by safety rating
        if requirements.safety_rating:
            filtered = [car for car in filtered if car.get("safety_rating", 0) >= requirements.safety_rating]
        
        # Filter by fuel type
        if requirements.fuel_type:
            filtered = [car for car in filtered if car.get("specs", {}).get("fuel_type", "").lower() == requirements.fuel_type.lower()]
        
        # Filter by transmission
        if requirements.transmission:
            filtered = [car for car in filtered if car.get("specs", {}).get("transmission", "").lower() == requirements.transmission.lower()]
        
        # Filter by price range
        if requirements.price_min:
            filtered = [car for car in filtered if car.get("price", 0) >= requirements.price_min]
        if requirements.price_max:
            filtered = [car for car in filtered if car.get("price", 0) <= requirements.price_max]
        
        return filtered
    
    def score_cars(self, cars: List[Dict[str, Any]], requirements: ExtractedRequirements) -> List[Dict[str, Any]]:
        """Score cars based on priorities and use case"""
        scored_cars = []
        
        for car in cars:
            score = 0
            car_copy = car.copy()
            
            # Base score from safety rating
            score += car.get("safety_rating", 0) * 10
            
            # Score based on priorities
            if requirements.priorities:
                if "mileage" in requirements.priorities:
                    mileage = float(car.get("mileage", "0").split()[0])
                    score += mileage * 2
                
                if "safety" in requirements.priorities:
                    score += car.get("safety_rating", 0) * 15
                
                if "performance" in requirements.priorities:
                    power = float(car.get("specs", {}).get("power", "0").split()[0])
                    score += power * 0.5
            
            # Score based on use case
            if requirements.use_case:
                if "city" in requirements.use_case.lower():
                    # Prefer smaller cars for city
                    if car.get("body_type") in ["Hatchback", "Sedan"]:
                        score += 20
                    # Prefer automatic for city
                    if car.get("specs", {}).get("transmission") in ["Automatic", "AMT"]:
                        score += 10
                
                if "family" in requirements.use_case.lower():
                    # Prefer more seats for family
                    score += car.get("number_of_seats", 0) * 5
                    # Prefer SUVs for family
                    if car.get("body_type") == "SUV":
                        score += 15
            
            # Add user review rating to score
            reviews = car.get("user_reviews", [])
            if reviews:
                avg_rating = sum(review["rating"] for review in reviews) / len(reviews)
                score += avg_rating * 5
            
            car_copy["score"] = score
            scored_cars.append(car_copy)
        
        # Sort by score descending
        scored_cars.sort(key=lambda x: x["score"], reverse=True)
        return scored_cars
    
    def get_recommendations(self, requirements: ExtractedRequirements, limit: int = 3) -> List[Dict[str, Any]]:
        """Get top car recommendations based on requirements"""
        filtered_cars = self.filter_cars(requirements)
        
        if not filtered_cars:
            # If no cars match all filters, try with just body_type if specified
            if requirements.body_type:
                body_type_filtered = [car for car in self.cars if car.get("body_type", "").lower() == requirements.body_type.lower()]
                if body_type_filtered:
                    scored_cars = self.score_cars(body_type_filtered, requirements)
                    return scored_cars[:limit]
            
            # Final fallback: return top 3 by safety rating from entire dataset
            sorted_cars = sorted(self.cars, key=lambda x: x.get("safety_rating", 0), reverse=True)
            return sorted_cars[:limit]
        
        scored_cars = self.score_cars(filtered_cars, requirements)
        return scored_cars[:limit]
